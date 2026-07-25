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
  const cancelEntryBtn = document.getElementById("cancelEntryBtn");

  const categoryDialog = document.getElementById("categoryDialog");
  const categoryNameInput = document.getElementById("categoryName");
  const categoryColorInput = document.getElementById("categoryColor");
  const saveCategoryBtn = document.getElementById("saveCategoryBtn");
  const categoryList = document.getElementById("categoryList");
  const closeCategoryBtn = document.getElementById("closeCategoryBtn");

  const entryTypeSelect = document.getElementById("entryType");
  const savedMealWrap = document.getElementById("savedMealWrap");
  const savedMealSelect = document.getElementById("savedMealSelect");
  const customNoteWrap = document.getElementById("customNoteWrap");
  const customNoteInput = document.getElementById("customNote");

  let currentWeekStart = getStartOfWeek(new Date());

  function populateCategorySelect() {
    if (!entryCategorySelect) return;

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
    if (!savedMealSelect) return;

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
    if (!entryTypeSelect || !savedMealWrap || !customNoteWrap) return;

    const categoryId = entryCategorySelect ? entryCategorySelect.value : "";

    if (entryTypeSelect.value === "saved") {
      savedMealWrap.style.display = "block";
      customNoteWrap.style.display = "none";
      populateSavedMealSelect(categoryId, selectedMealId);
    } else {
      savedMealWrap.style.display = "none";
      customNoteWrap.style.display = "block";
    }
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
        <div>
          <div class="day-name">${dayName}</div>
          <div class="day-date">${formatDisplayDate(date)}</div>
        </div>
        <button class="btn" data-add-date="${dateKey}">Add</button>
      `;

      const entriesWrap = document.createElement("div");
      entriesWrap.className = "entries";

      if (dayEntries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-text";
        empty.textContent = "No items yet.";
        entriesWrap.appendChild(empty);
      } else {
        dayEntries.forEach((entry) => {
          const category = categories.find((cat) => cat.id === entry.categoryId);
          const color = category ? category.color : "#d9d9d9";
          const categoryName = category ? category.name : "Deleted category";

          const card = document.createElement("div");
          card.className = "entry-card";
          card.style.background = hexToRgba(color, 0.35);
          card.style.borderLeft = `4px solid ${color}`;

          const text = entry.text || "";
          const meta = entry.source === "savedMeal" ? "Saved meal" : "Custom note";

          card.innerHTML = `
            <div class="entry-top">
              <div class="entry-category">${escapeHtml(categoryName)}</div>
              <div class="entry-actions">
                <button class="mini-btn" data-edit-entry="${entry.id}" data-date="${dateKey}">Edit</button>
                <button class="mini-btn" data-delete-entry="${entry.id}" data-date="${dateKey}">Delete</button>
              </div>
            </div>
            <div class="entry-text">${escapeHtml(text)}</div>
            <div class="entry-meta">${meta}</div>
          `;

          entriesWrap.appendChild(card);
        });
      }

      column.appendChild(header);
      column.appendChild(entriesWrap);
      plannerGrid.appendChild(column);
    });
  }

  function renderCategories() {
    if (!categoryList) return;

    categoryList.innerHTML = "";

    if (categories.length === 0) {
      categoryList.innerHTML = `<p class="helper">No categories yet.</p>`;
      return;
    }

    categories.forEach((category) => {
      const row = document.createElement("div");
      row.className = "category-row";
      row.innerHTML = `
        <div class="category-row-left">
          <span class="swatch" style="background:${category.color}"></span>
          <span>${escapeHtml(category.name)}</span>
        </div>
        <div class="category-row-actions">
          <button class="btn" data-edit-category="${category.id}">Edit</button>
          <button class="btn btn-danger" data-delete-category="${category.id}">Delete</button>
        </div>
      `;
      categoryList.appendChild(row);
    });
  }

  function openEntryDialog(dateKey, entryId = null) {
    if (categories.length === 0) {
      alert("Please create a category first.");
      return;
    }

    populateCategorySelect();
    entryForm.reset();
    entryDateInput.value = dateKey;
    editingEntryIdInput.value = "";
    entryDialogTitle.textContent = "Add entry";

    if (entryTypeSelect) {
      entryTypeSelect.value = "saved";
    }

    if (entryId) {
      const dayEntries = entries[dateKey] || [];
      const entry = dayEntries.find((item) => item.id === entryId);
      if (!entry) return;

      editingEntryIdInput.value = entry.id;
      entryCategorySelect.value = entry.categoryId || "";
      entryDialogTitle.textContent = "Edit entry";

      if (entry.source === "savedMeal") {
        if (entryTypeSelect) {
          entryTypeSelect.value = "saved";
        }
        updateEntryTypeUI(entry.mealId || "");
      } else {
        if (entryTypeSelect) {
          entryTypeSelect.value = "custom";
        }
        updateEntryTypeUI();
        if (customNoteInput) {
          customNoteInput.value = entry.text || "";
        }
      }
    } else {
      updateEntryTypeUI();
    }

    entryDialog.showModal();
  }

  function saveEntry(event) {
    event.preventDefault();

    const dateKey = entryDateInput.value;
    const categoryId = entryCategorySelect.value;
    const editingId = editingEntryIdInput.value;

    if (!dateKey || !categoryId) return;

    let text = "";
    let source = "customNote";
    let mealId = null;

    if (entryTypeSelect && entryTypeSelect.value === "saved") {
      const selectedMealId = savedMealSelect ? savedMealSelect.value : "";
      const selectedMeal = savedMeals.find((meal) => meal.id === selectedMealId);

      if (!selectedMeal) {
        alert("Please choose a saved meal.");
        return;
      }

      text = selectedMeal.title;
      source = "savedMeal";
      mealId = selectedMeal.id;
    } else {
      text = customNoteInput ? customNoteInput.value.trim() : "";
      if (!text) {
        alert("Please write a note.");
        return;
      }
      source = "customNote";
    }

    if (!entries[dateKey]) {
      entries[dateKey] = [];
    }

    if (editingId) {
      const existing = entries[dateKey].find((item) => item.id === editingId);
      if (existing) {
        existing.categoryId = categoryId;
        existing.text = text;
        existing.source = source;
        existing.mealId = mealId;
      }
    } else {
      entries[dateKey].push({
        id: makeId(),
        categoryId,
        text,
        source,
        mealId
      });
    }

    saveEntries();
    entryDialog.close();
    renderPlanner();
  }

  function addCategory() {
    const name = categoryNameInput.value.trim();
    const color = categoryColorInput.value;

    if (!name) {
      alert("Enter a category name.");
      return;
    }

    categories.push({
      id: makeId(),
      name,
      color
    });

    saveCategories();
    categoryNameInput.value = "";
    categoryColorInput.value = "#f4b183";
    renderCategories();
    renderPlanner();
  }

  function editCategory(categoryId) {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;

    const newName = prompt("Edit category name:", category.name);
    if (newName === null) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert("Category name cannot be empty.");
      return;
    }

    const newColor = prompt("Edit colour hex code:", category.color);
    if (newColor === null) return;

    category.name = trimmedName;
    category.color = newColor.trim() || category.color;

    saveCategories();
    renderCategories();
    renderPlanner();
  }

  function deleteCategory(categoryId) {
    const isUsedInEntries = Object.values(entries).some((dayEntries) =>
      dayEntries.some((entry) => entry.categoryId === categoryId)
    );

    const isUsedInMeals = savedMeals.some((meal) => meal.categoryId === categoryId);

    if (isUsedInEntries || isUsedInMeals) {
      const confirmed = confirm(
        "This category is used in planner items or meals. Delete it anyway?"
      );
      if (!confirmed) return;
    }

    categories = categories.filter((cat) => cat.id !== categoryId);
    savedMeals = savedMeals.filter((meal) => meal.categoryId !== categoryId);

    saveCategories();
    saveMeals();
    renderCategories();
    renderPlanner();
  }

  plannerGrid.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-date]");
    const editBtn = event.target.closest("[data-edit-entry]");
    const deleteBtn = event.target.closest("[data-delete-entry]");

    if (addBtn) {
      openEntryDialog(addBtn.dataset.addDate);
      return;
    }

    if (editBtn) {
      openEntryDialog(editBtn.dataset.date, editBtn.dataset.editEntry);
      return;
    }

    if (deleteBtn) {
      const dateKey = deleteBtn.dataset.date;
      const entryId = deleteBtn.dataset.deleteEntry;
      entries[dateKey] = (entries[dateKey] || []).filter((entry) => entry.id !== entryId);
      saveEntries();
      renderPlanner();
    }
  });

  if (categoryList) {
    categoryList.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-edit-category]");
      const deleteBtn = event.target.closest("[data-delete-category]");

      if (editBtn) {
        editCategory(editBtn.dataset.editCategory);
      }

      if (deleteBtn) {
        deleteCategory(deleteBtn.dataset.deleteCategory);
      }
    });
  }

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener("click", () => {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      currentWeekStart = getStartOfWeek(currentWeekStart);
      renderPlanner();
    });
  }

  if (nextWeekBtn) {
    nextWeekBtn.addEventListener("click", () => {
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      currentWeekStart = getStartOfWeek(currentWeekStart);
      renderPlanner();
    });
  }

  if (manageCategoriesBtn) {
    manageCategoriesBtn.addEventListener("click", () => {
      renderCategories();
      categoryDialog.showModal();
    });
  }

  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener("click", addCategory);
  }

  if (closeCategoryBtn) {
    closeCategoryBtn.addEventListener("click", () => {
      categoryDialog.close();
    });
  }

  if (cancelEntryBtn) {
    cancelEntryBtn.addEventListener("click", () => {
      entryDialog.close();
    });
  }

  if (entryForm) {
    entryForm.addEventListener("submit", saveEntry);
  }

  if (entryCategorySelect) {
    entryCategorySelect.addEventListener("change", () => updateEntryTypeUI());
  }

  if (entryTypeSelect) {
    entryTypeSelect.addEventListener("change", () => updateEntryTypeUI());
  }

  renderCategories();
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