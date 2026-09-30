const copyButton = document.querySelector("[data-copy-target]");
const copyStatus = document.querySelector(".copy-status");
const showcaseVideo = document.querySelector("[data-video-manifest]");
const videoStatus = document.querySelector(".video-status");
const teaserImages = document.querySelectorAll("[data-teaser-image]");
const teaserLinks = document.querySelectorAll("[data-teaser-link]");

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function loadShowcaseVideo() {
  if (!showcaseVideo) return;

  try {
    const manifestUrl = showcaseVideo.dataset.videoManifest;
    const manifestResponse = await fetch(manifestUrl);

    if (!manifestResponse.ok) {
      throw new Error(`Unable to load video manifest: ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json();
    const chunks = await Promise.all(
      manifest.parts.map(async (partUrl) => {
        const response = await fetch(partUrl);

        if (!response.ok) {
          throw new Error(`Unable to load video chunk: ${response.status}`);
        }

        return response.text();
      })
    );

    const blob = base64ToBlob(chunks.join(""), manifest.mime || "video/mp4");
    const objectUrl = URL.createObjectURL(blob);
    showcaseVideo.src = objectUrl;
    showcaseVideo.load();

    showcaseVideo.addEventListener("loadedmetadata", () => {
      if (videoStatus) videoStatus.textContent = "";
      showcaseVideo.play().catch(() => {});
    }, { once: true });
  } catch (error) {
    if (videoStatus) {
      videoStatus.textContent = "The showcase video could not be loaded in this browser.";
    }
  }
}

async function loadTeaserImage() {
  const teaserSrc = document.body.dataset.teaserSrc;

  if (!teaserSrc || teaserImages.length === 0) return;

  try {
    const response = await fetch(teaserSrc);

    if (!response.ok) {
      throw new Error(`Unable to load teaser image: ${response.status}`);
    }

    const dataUri = `data:image/jpeg;base64,${await response.text()}`;
    teaserImages.forEach((element) => {
      if (element.tagName === "VIDEO") {
        element.poster = dataUri;
      } else {
        element.src = dataUri;
      }
    });
    teaserLinks.forEach((element) => {
      element.href = dataUri;
    });
  } catch {
    // The inline placeholder keeps layout stable if the teaser cannot be loaded.
  }
}

if (copyButton && copyStatus) {
  copyButton.addEventListener("click", async () => {
    const target = document.getElementById(copyButton.dataset.copyTarget);
    const text = target ? target.innerText.trim() : "";

    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = "BibTeX copied.";
      copyButton.textContent = "Copied";
    } catch {
      copyStatus.textContent = "Select the BibTeX block and copy it manually.";
    }

    window.setTimeout(() => {
      copyButton.textContent = "Copy BibTeX";
      copyStatus.textContent = "";
    }, 2400);
  });
}

loadTeaserImage();
loadShowcaseVideo();
