const contentElement = document.querySelector(".modal-content")!;
const modalElement = document.querySelector(".modal") as HTMLStyleElement;
const containerElement = document.querySelector(
    ".modal-container"
) as HTMLStyleElement;

function closeModal() {
    console.log("close");

    containerElement.classList.remove("open");
}

function openModal(content: string, maxWidth: number) {
    modalElement.style.maxWidth = `${maxWidth}px`;
    contentElement.innerHTML = content;
    containerElement.classList.add("open");
}

document.querySelector(".modal .close")!.addEventListener("click", closeModal);

// what?: trucazo para evitar el parpadeo del modal-container
setTimeout(() => (containerElement.style.display = ""), 500);

export { openModal, closeModal };
