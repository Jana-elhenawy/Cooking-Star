document.addEventListener("DOMContentLoaded", function () {

    const addBtn    = document.getElementById("addIngredientBtn");
    const container = document.getElementById("ingredientsContainer");
    let ingredientCount = 0;
    let uploadedImageDataURL = ""; // stores base64 of uploaded image

    // ── ADD INGREDIENT ──
    function addIngredient() {
        ingredientCount++;

        const row = document.createElement("div");
        row.className = "ingredient-row";
        row.innerHTML = `
            <div>
                <label>Ingredient ${ingredientCount}:</label>
                <input type="text" class="ingredient-input" placeholder="e.g., Olive oil">
            </div>
            <div>
                <label>Quantity:</label>
                <input type="text" class="quantity-input" placeholder="e.g., 2 tbsp">
            </div>
            <button type="button" class="btn-danger remove-ingredient"
                onclick="this.parentElement.remove(); fixNumbers(); checkIngredients();">
                ✖
            </button>
        `;

        row.style.opacity   = "0";
        row.style.transform = "translateY(20px)";
        container.appendChild(row);

        setTimeout(() => {
            row.style.transition = "all 0.3s ease";
            row.style.opacity    = "1";
            row.style.transform  = "translateY(0)";
        }, 10);

        row.querySelectorAll("input").forEach(input => {
            input.addEventListener("input", checkIngredients);
        });

        checkIngredients();
    }

    // ── FIX INGREDIENT NUMBERS AFTER REMOVAL ──
    window.fixNumbers = function () {
        const rows = document.querySelectorAll(".ingredient-row");
        rows.forEach((row, index) => {
            row.querySelector("label").innerText = `Ingredient ${index + 1}:`;
        });
        ingredientCount = rows.length;
    };

    // ── VALIDATE INGREDIENTS ──
    function checkIngredients() {
        const ingredients = document.querySelectorAll(".ingredient-input");
        const quantities  = document.querySelectorAll(".quantity-input");
        const error       = document.getElementById("ingredientError");
        let valid = false;
        for (let i = 0; i < ingredients.length; i++) {
            if (ingredients[i].value.trim() && quantities[i].value.trim()) {
                valid = true;
                break;
            }
        }
        error.style.display = (valid || ingredients.length === 0) ? "none" : "block";
    }

    // ── SAVE RECIPE ──
    window.saveRecipe = async function () {
        let valid = true;

        const nameEl         = document.getElementById("recipeName");
        const courseEl       = document.getElementById("courseType");
        const timeEl         = document.getElementById("cookingTime");
        const instructionsEl = document.getElementById("instructions");

        // Clear previous errors
        ["nameError","courseError","timeError","instructionsError"].forEach(id => {
            document.getElementById(id).style.display = "none";
        });

        if (!nameEl.value.trim()) {
            document.getElementById("nameError").style.display = "block";
            valid = false;
        }
        if (!courseEl.value) {
            document.getElementById("courseError").style.display = "block";
            valid = false;
        }
        if (!timeEl.value || parseInt(timeEl.value) < 1) {
            document.getElementById("timeError").style.display = "block";
            valid = false;
        }
        if (!instructionsEl.value.trim()) {
            document.getElementById("instructionsError").style.display = "block";
            valid = false;
        }

        if (!valid) return false;

        // ── Collect ingredients ──
        const ingredientInputs = document.querySelectorAll(".ingredient-input");
        const quantityInputs   = document.querySelectorAll(".quantity-input");
        const ingredients = [];
        ingredientInputs.forEach((inp, i) => {
            const name = inp.value.trim();
            const qty  = quantityInputs[i]?.value.trim();
            if (name) ingredients.push({ name, qty: qty || "" });
        });

        const courseClean = courseEl.value.replace(/^[^\w]+/, "").trim();
        const imageFile = document.getElementById("imageInput").files[0] || null;
        const recipeData = { title: nameEl.value.trim(), course: courseClean, time_minutes: parseInt(timeEl.value), difficulty: 2, description: instructionsEl.value.trim(), instructions: instructionsEl.value.trim(), ingredients: JSON.stringify(ingredients), };
        const res = await createRecipe(recipeData, imageFile); if (res.ok || res.status === 201) { showToast("✅ Recipe saved successfully!");
        
         }
        else { const err = await res.json().catch(() => ({})); showToast("❌ " + (err.error || "Could not save recipe.")); return false; }

        // ── Reset form ──
        setTimeout(() => {
            document.querySelector("form").reset();
            container.innerHTML   = "";
            ingredientCount       = 0;
            uploadedImageDataURL  = "";
            document.getElementById("imagePreview").innerHTML = "";
        }, 300);

        return false; // prevent form submission
    };

    // ── CLEAR FORM ──
    window.clearForm = function () {
        setTimeout(() => {
            document.querySelector("form").reset();
            container.innerHTML  = "";
            ingredientCount      = 0;
            uploadedImageDataURL = "";
            document.getElementById("imagePreview").innerHTML = "";
            ["nameError","courseError","timeError","instructionsError","ingredientError"].forEach(id => {
                document.getElementById(id).style.display = "none";
            });
        }, 50);
    };

    // ── IMAGE PREVIEW + store as base64 ──
    document.getElementById("imageInput").addEventListener("change", function (e) {
        const preview = document.getElementById("imagePreview");
        const file    = e.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (ev) {
                uploadedImageDataURL = ev.target.result; // save for recipe object
                preview.innerHTML = `<img src="${ev.target.result}">`;
            };
            reader.readAsDataURL(file);
        } else {
            uploadedImageDataURL = "";
            preview.innerHTML    = "";
        }
    });

    // ── BUTTON CLICK ──
    addBtn.addEventListener("click", addIngredient);

});