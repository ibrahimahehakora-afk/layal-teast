const imageViewer = document.getElementById('imageViewer');
const viewerImage = document.getElementById('viewerImage');
const viewerClose = document.getElementById('imageViewerClose');

if (imageViewer && viewerImage && viewerClose) {
    document.querySelectorAll('.card img').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            const highRes = img.dataset.highRes ? img.dataset.highRes.replace('\\', '/') : null;
            viewerImage.src = highRes || img.src.replace('\\', '/');
            viewerImage.alt = img.alt || 'صورة من المعرض';
            imageViewer.classList.add('showing');
            imageViewer.setAttribute('aria-hidden', 'false');
        });
    });

    const closeViewer = () => {
        imageViewer.classList.remove('showing');
        imageViewer.setAttribute('aria-hidden', 'true');
        viewerImage.src = '';
    };

    viewerClose.addEventListener('click', closeViewer);
    imageViewer.addEventListener('click', event => {
        if (event.target.dataset.close === 'true') {
            closeViewer();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && imageViewer.classList.contains('showing')) {
            closeViewer();
        }
    });
}
