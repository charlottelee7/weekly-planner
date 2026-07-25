const CATEGORY_KEY = "plannerCategories";
const MEALS_KEY = "savedMeals";
const ENTRIES_KEY = "plannerEntries";

function getSavedData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function getDefaultCategories() {
  return [
    { id: makeId(), name: "Dinner", color: "#f4b183" },
    { id: makeId(), name: "Study", color: "#a4c2f4" },
    { id: makeId(), name: "Gym", color: "#b6d7a8" }
  ];
}

let categories = getSavedData(CATEGORY_KEY, getDefaultCategories());
let savedMeals = getSavedData(MEALS_KEY, []);
let entries = getSavedData(ENTRIES_KEY, {});

function saveCategories() {
  saveData(CATEGORY_KEY, categories);
}

function saveMeals() {
  saveData(MEALS_KEY, savedMeals);
}

function saveEntries() {
  saveData(ENTRIES_KEY, entries);
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}

function formatWeekTitle(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startText = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });

  const endText = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return `${startText} – ${endText}`;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* -----------------------------
   PLANNER PAGE
----------------------------- */

const plannerGrid = document.getElementById("plannerGrid");

if (plannerGrid) {
  const weekTitle = document.getElementById("weekTitle");
  const prevWeekBtn = document.getElementById("prevWeekBtn");
  const nextWeekBtn = document.getElementById("nextWeekBtn");
  const manageCategoriesBtn = document.getElementById("manageCategoriesBtn");

  const entryDialog = document.getElementById("entryDialog");
  const entryForm = document.getElementById("entryForm");
  const entryDialogTitle = document.getElementById("entryDialogTitle");
  const entryDateInput = document.getElementById("entryDate");
  const editingEntryIdInput = document.getElementById("editingEntryId");
  const entryCategorySelect = document.getElementById("entryCategory");
  const entryTypeSelect = document.getElementById("entryType");
  const savedMealWrap = document.getElementById("savedMealWrap");
  const savedMealSelect = document.getElementById("savedMealSelect");
  const customNoteWrap = document.getElementById("customNoteWrap");
  const customNoteInput = document.getElementById("customNote");
  const cancelEntryBtn = document.getElementById("cancelEntryBtn");

  const categoryDialog = document.getElementById("categoryDialog");
  const categoryNameInput = document.getElementById("categoryName");
  const categoryColorInput = document.getElementById("categoryColor");
  const colorPreview = document.getElementById("colorPreview");
  const saveCategoryBtn = document.getElementById("saveCategoryBtn");
  const categoryList = document.getElementById("categoryList");
  const closeCategoryBtn = document.getElementById("closeCategoryBtn");

  let currentWeekStart = getStartOfWeek(new Date());
  let editingCategoryId = "";

  function syncColorPreview() {
    if (categoryColorInput && colorPreview) {
      colorPreview.style.background = categoryColorInput.value || "#f4b183";
    }
  }

  function populateCategorySelect() {
    entryCategorySelect.innerHTML = "";

    if (categories.length === 0) {
      const option = document.createElement("option");
      option.textContent = "No categories available";
      option.value = "";
      entryCategorySelect.appendChild(option);
      return;
    }

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      entryCategorySelect.appendChild(option);
    });
  }

  function populateSavedMealSelect(categoryId, selectedMealId = "") {
    savedMealSelect.innerHTML = "";

    const mealsForCategory = savedMeals.filter((meal) => meal.categoryId === categoryId);

    if (mealsForCategory.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No saved meals in this category";
      savedMealSelect.appendChild(option);
      return;
    }

    mealsForCategory.forEach((meal) => {
      const option = document.createElement("option");
      option.value = meal.id;
      option.textContent = meal.title;
      if (meal.id === selectedMealId) {
        option.selected = true;
      }
      savedMealSelect.appendChild(option);
    });
  }

  function updateEntryTypeUI(selectedMealId = "") {
    const categoryId = entryCategorySelect.value;

    if (entryTypeSelect.value === "saved") {
      savedMealWrap.style.display = "block";
      customNoteWrap.style.display = "none";
      populateSavedMealSelect(categoryId, selectedMealId);
    } else {
      savedMealWrap.style.display = "none";
      customNoteWrap.style.display = "block";
    }
  }

  function openEntryDialog(dateKey, entry = null) {
    populateCategorySelect();

    entryDateInput.value = dateKey;
    editingEntryIdInput.value = entry ? entry.id : "";

    if (entry) {
      entryDialogTitle.textContent = "Edit entry";
      entryCategorySelect.value = entry.categoryId || "";
      entryTypeSelect.value = entry.type || "custom";

      if (entry.type === "saved") {
        updateEntryTypeUI(entry.mealId || "");
        customNoteInput.value = "";
      } else {
        updateEntryTypeUI();
        customNoteInput.value = entry.text || "";
      }
    } else {
      entryDialogTitle.textContent = "Add entry";
      entryForm.reset();
      editingEntryIdInput.value = "";
      entryDateInput.value = dateKey;
      populateCategorySelect();
      entryTypeSelect.value = "saved";
      updateEntryTypeUI();
    }

    entryDialog.showModal();
  }

  function closeEntryDialog() {
    entryDialog.close();
    entryForm.reset();
    editingEntryIdInput.value = "";
  }

  function renderPlanner() {
    plannerGrid.innerHTML = "";
    weekTitle.textContent = formatWeekTitle(currentWeekStart);

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    dayNames.forEach((dayName, index) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + index);

      const dateKey = formatDateKey(date);
      const dayEntries = entries[dateKey] || [];

      const column = document.createElement("article");
      column.className = "day-column";

      const header = document.createElement("div");
      header.className = "day-header";
      header.innerHTML = `
        <div class="day-top">
          <div>
            <div class="day-name">${dayName}</div>
            <div class="day-date">${formatDisplayDate(date)}</div>
          </div>
          <button type="button" class="btn" data-add-entry="${dateKey}">Add</button>
        </div>
      `;

      const list = document.createElement("div");
      list.className = "entries";

      if (dayEntries.length === 0) {
        list.innerHTML = `<p class="empty-text">Nothing planned yet.</p>`;
      } else {
        dayEntries.forEach((entry) => {
          const category = categories.find((item) => item.id === entry.categoryId);
          const bg = category ? hexToRgba(category.color, 0.32) : "rgba(220,220,220,0.5)";
          const label = category ? category.name : "Unknown category";

          let text = entry.text || "";
          if (entry.type === "saved" && entry.mealId) {
            const meal = savedMeals.find((item) => item.id === entry.mealId);
            text = meal ? meal.title : "Saved meal";
          }

          const card = document.createElement("article");
          card.className = "entry-card";
          card.style.background = bg;

          card.innerHTML = `
            <div class="entry-top">
              <div class="entry-category">${escapeHtml(label)}</div>
            </div>
            <div class="entry-text">${escapeHtml(text)}</div>
            <div class="entry-actions">
              <button type="button" class="mini-btn" data-edit-entry="${dateKey}" data-entry-id="${entry.id}">Edit</button>
              <button type="button" class="mini-btn" data-delete-entry="${dateKey}" data-entry-id="${entry.id}">Delete</button>
            </div>
          `;

          list.appendChild(card);
        });
      }

      column.appendChild(header);
      column.appendChild(list);
      plannerGrid.appendChild(column);
    });
  }

  function resetCategoryForm() {
    editingCategoryId = "";
    categoryNameInput.value = "";
    categoryColorInput.value = "#f4b183";
    saveCategoryBtn.textContent = "Add category";
    syncColorPreview();
  }

  function renderCategoryList() {
    categoryList.innerHTML = "";

    if (categories.length === 0) {
      categoryList.innerHTML = `<p class="helper">No categories yet.</p>`;
      return;
    }

    categories.forEach((category) => {
      const row = document.createElement("div");
      row.className = "category-row";

      row.innerHTML = `
        <span class="swatch" style="background:${category.color}"></span>
        <span>${escapeHtml(category.name)}</span>
        <button type="button" class="btn" data-edit-category="${category.id}">Edit</button>
        <button type="button" class="btn btn-danger" data-delete-category="${category.id}">Delete</button>
      `;

      categoryList.appendChild(row);
    });
  }

  function startEditCategory(categoryId) {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;

    editingCategoryId = category.id;
    categoryNameInput.value = category.name || "";
    categoryColorInput.value = category.color || "#f4b183";
    saveCategoryBtn.textContent = "Save changes";
    syncColorPreview();
    categoryNameInput.focus();
  }

  function saveCategory() {
    const name = categoryNameInput.value.trim();
    const color = categoryColorInput.value;

    if (!name) {
      alert("Please enter a category name.");
      return;
    }

    if (editingCategoryId) {
      const category = categories.find((item) => item.id === editingCategoryId);
      if (!category) return;

      category.name = name;
      category.color = color;
    } else {
      categories.push({
        id: makeId(),
        name,
        color
      });
    }

    saveCategories();
    populateCategorySelect();
    renderCategoryList();
    renderPlanner();
    resetCategoryForm();
  }

  function deleteCategory(categoryId) {
    categories = categories.filter((category) => category.id !== categoryId);

    Object.keys(entries).forEach((dateKey) => {
      entries[dateKey] = (entries[dateKey] || []).filter(
        (entry) => entry.categoryId !== categoryId
      );

      if (entries[dateKey].length === 0) {
        delete entries[dateKey];
      }
    });

    savedMeals = savedMeals.filter((meal) => meal.categoryId !== categoryId);

    saveCategories();
    saveEntries();
    saveMeals();
    populateCategorySelect();
    renderCategoryList();
    renderPlanner();
    resetCategoryForm();
  }

  entryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const dateKey = entryDateInput.value;
    const editingId = editingEntryIdInput.value;
    const categoryId = entryCategorySelect.value;
    const type = entryTypeSelect.value;

    if (!categoryId) {
      alert("Please create a category first.");
      return;
    }

    let text = "";
    let mealId = "";

    if (type === "saved") {
      mealId = savedMealSelect.value;
      if (!mealId) {
        alert("Please choose a saved meal.");
        return;
      }
    } else {
      text = customNoteInput.value.trim();
      if (!text) {
        alert("Please enter a custom note.");
        return;
      }
    }

    if (!entries[dateKey]) {
      entries[dateKey] = [];
    }

    if (editingId) {
      const entry = entries[dateKey].find((item) => item.id === editingId);
      if (entry) {
        entry.categoryId = categoryId;
        entry.type = type;
        entry.mealId = mealId;
        entry.text = text;
      }
    } else {
      entries[dateKey].push({
        id: makeId(),
        categoryId,
        type,
        mealId,
        text
      });
    }

    saveEntries();
    renderPlanner();
    closeEntryDialog();
  });

  plannerGrid.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-entry]");
    const editBtn = event.target.closest("[data-edit-entry]");
    const deleteBtn = event.target.closest("[data-delete-entry]");

    if (addBtn) {
      openEntryDialog(addBtn.dataset.addEntry);
      return;
    }

    if (editBtn) {
      const dateKey = editBtn.dataset.editEntry;
      const entryId = editBtn.dataset.entryId;
      const entry = (entries[dateKey] || []).find((item) => item.id === entryId);
      if (entry) {
        openEntryDialog(dateKey, entry);
      }
      return;
    }

    if (deleteBtn) {
      const dateKey = deleteBtn.dataset.deleteEntry;
      const entryId = deleteBtn.dataset.entryId;
      entries[dateKey] = (entries[dateKey] || []).filter((item) => item.id !== entryId);

      if (entries[dateKey].length === 0) {
        delete entries[dateKey];
      }

      saveEntries();
      renderPlanner();
    }
  });

  entryCategorySelect.addEventListener("change", () => {
    updateEntryTypeUI();
  });

  entryTypeSelect.addEventListener("change", () => {
    updateEntryTypeUI();
  });

  cancelEntryBtn.addEventListener("click", () => {
    closeEntryDialog();
  });

  if (categoryColorInput) {
    categoryColorInput.addEventListener("input", syncColorPreview);
    syncColorPreview();
  }

  saveCategoryBtn.addEventListener("click", saveCategory);

  categoryList.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit-category]");
    const deleteBtn = event.target.closest("[data-delete-category]");

    if (editBtn) {
      startEditCategory(editBtn.dataset.editCategory);
      return;
    }

    if (deleteBtn) {
      deleteCategory(deleteBtn.dataset.deleteCategory);
    }
  });

  manageCategoriesBtn.addEventListener("click", () => {
    renderCategoryList();
    resetCategoryForm();
    categoryDialog.showModal();
  });

  closeCategoryBtn.addEventListener("click", () => {
    resetCategoryForm();
    categoryDialog.close();
  });

  prevWeekBtn.addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    currentWeekStart = getStartOfWeek(currentWeekStart);
    renderPlanner();
  });

  nextWeekBtn.addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    currentWeekStart = getStartOfWeek(currentWeekStart);
    renderPlanner();
  });

  populateCategorySelect();
  renderPlanner();
}

/* -----------------------------
   MEALS PAGE
----------------------------- */

const mealCategorySelect = document.getElementById("mealCategorySelect");

if (mealCategorySelect) {
  const mealForm = document.getElementById("mealForm");
  const editingMealIdInput = document.getElementById("editingMealId");
  const mealTitleInput = document.getElementById("mealTitle");
  const mealDescriptionInput = document.getElementById("mealDescription");
  const mealSubmitBtn = document.getElementById("mealSubmitBtn");
  const mealsList = document.getElementById("mealsList");

  function populateMealCategories() {
    mealCategorySelect.innerHTML = "";

    if (categories.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No categories available";
      mealCategorySelect.appendChild(option);
      return;
    }

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      mealCategorySelect.appendChild(option);
    });
  }

  function resetMealForm() {
    const currentCategory = mealCategorySelect.value;
    mealForm.reset();
    editingMealIdInput.value = "";
    mealCategorySelect.value = currentCategory;
    mealSubmitBtn.textContent = "Add meal";
  }

  function fillMealForm(meal) {
    if (!meal) return;

    editingMealIdInput.value = meal.id;
    mealCategorySelect.value = meal.categoryId;
    mealTitleInput.value = meal.title || "";
    mealDescriptionInput.value = meal.description || "";
    mealSubmitBtn.textContent = "Save changes";
    mealTitleInput.focus();
  }

  function renderMeals() {
    mealsList.innerHTML = "";

    const currentCategoryId = mealCategorySelect.value;
    const mealsForCategory = savedMeals.filter((meal) => meal.categoryId === currentCategoryId);

    if (!currentCategoryId) {
      mealsList.innerHTML = `<p class="helper">Create a category on the planner page first.</p>`;
      return;
    }

    if (mealsForCategory.length === 0) {
      mealsList.innerHTML = `<p class="helper">No saved meals in this category yet.</p>`;
      return;
    }

    mealsForCategory.forEach((meal) => {
      const card = document.createElement("article");
      card.className = "meal-card";

      card.innerHTML = `
        <h3>${escapeHtml(meal.title)}</h3>
        ${meal.description ? `<p>${escapeHtml(meal.description)}</p>` : ""}
        <div class="meal-card-actions">
          <button type="button" class="btn" data-edit-meal="${meal.id}">Edit</button>
          <button type="button" class="btn btn-danger" data-delete-meal="${meal.id}">Delete</button>
        </div>
      `;

      mealsList.appendChild(card);
    });
  }

  mealForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const editingId = editingMealIdInput.value;
    const categoryId = mealCategorySelect.value;
    const title = mealTitleInput.value.trim();
    const description = mealDescriptionInput.value.trim();

    if (!categoryId) {
      alert("Please create a category first on the planner page.");
      return;
    }

    if (!title) {
      alert("Meal title is required.");
      return;
    }

    if (editingId) {
      const meal = savedMeals.find((item) => item.id === editingId);

      if (!meal) {
        alert("Could not find that meal to edit.");
        return;
      }

      meal.categoryId = categoryId;
      meal.title = title;
      meal.description = description;
    } else {
      savedMeals.push({
        id: makeId(),
        categoryId,
        title,
        description
      });
    }

    saveMeals();
    renderMeals();
    resetMealForm();
  });

  mealsList.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit-meal]");
    const deleteBtn = event.target.closest("[data-delete-meal]");

    if (editBtn) {
      const mealId = editBtn.dataset.editMeal;
      const meal = savedMeals.find((item) => item.id === mealId);
      fillMealForm(meal);
      return;
    }

    if (deleteBtn) {
      const mealId = deleteBtn.dataset.deleteMeal;
      savedMeals = savedMeals.filter((meal) => meal.id !== mealId);
      saveMeals();
      renderMeals();
      resetMealForm();
    }
  });

  mealCategorySelect.addEventListener("change", () => {
    renderMeals();
    resetMealForm();
  });

  populateMealCategories();
  renderMeals();
}