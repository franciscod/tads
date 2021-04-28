const contentElement = document.querySelector(".modal-content")!;
const modalElement = document.querySelector(".modal") as HTMLStyleElement;
const containerElement = document.querySelector(".modal-container") as HTMLStyleElement;

const closeModal = () => {
    containerElement.classList.remove("open");
};

const openModal = (content: string, maxWidth: number) => {
    modalElement.style.maxWidth = `${maxWidth}px`;
    contentElement.innerHTML = content;
    containerElement.classList.add("open");
};

document.querySelector(".modal .close")!.addEventListener("click", closeModal);

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
});

// what?: trucazo para evitar el parpadeo del modal-container
setTimeout(() => (containerElement.style.display = ""), 500);

export { openModal, closeModal };
