// index.js

document.querySelectorAll(".center-page .btn").forEach(btn => {

    btn.addEventListener("click", function (e) {

        e.preventDefault();

        const target = this.getAttribute("href");

        this.style.transition = "transform 0.15s ease";
        this.style.transform = "scale(0.93)";

        setTimeout(() => {
            this.style.transform = "scale(1)";
        }, 150);

        setTimeout(() => {
            window.location.href = target;
        }, 200);
    });

});