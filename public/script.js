document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const studentForm = document.getElementById("student-form");
  const adminPanel = document.getElementById("admin-panel");
  const adminForm = document.getElementById("admin-form");
  const addStudentForm = document.getElementById("add-student-form");
  const roleRadios = document.querySelectorAll('input[name="role"]');

  const transactionTab = document.getElementById("transaction-tab");
  const studentTab = document.getElementById("student-tab");

  // Handle role switching
  roleRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "student") {
        studentForm.style.display = "flex";
        adminPanel.style.display = "none";
      } else {
        studentForm.style.display = "none";
        adminPanel.style.display = "flex";
        adminForm.style.display = "flex";
        addStudentForm.style.display = "none";
        transactionTab.classList.add("active-tab");
        studentTab.classList.remove("active-tab");
      }
    });
  });

  // Toggle between transaction and student forms
  transactionTab.addEventListener("click", () => {
    adminForm.style.display = "flex";
    addStudentForm.style.display = "none";
    transactionTab.classList.add("active-tab");
    studentTab.classList.remove("active-tab");
  });

  studentTab.addEventListener("click", () => {
    adminForm.style.display = "none";
    addStudentForm.style.display = "flex";
    transactionTab.classList.remove("active-tab");
    studentTab.classList.add("active-tab");
  });

  // Handle student form submission
  studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(studentForm);

    const data = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      student_id: formData.get("student_id"),
    };

    try {
      const response = await fetch("/check-default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        alert("Error: " + result.error);
      } else {
        alert(
          `${result.name} ${
            result.defaulting ? "is defaulting." : "is not defaulting."
          }`
        );
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    }
  });

  // Handle admin transaction form submission
  adminForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(adminForm);

    const data = {
      student_id: formData.get("admin_student_id"),
      type: formData.get("transaction_type"),
      amount: parseFloat(formData.get("transaction_amount")),
    };

    try {
      const response = await fetch("/admin/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        alert("Error: " + result.error);
      } else {
        alert("Transaction recorded successfully.");
        adminForm.reset();
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    }
  });

  // Handle add student form submission
  addStudentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(addStudentForm);

    const data = {
      first_name: formData.get("new_first_name"),
      last_name: formData.get("new_last_name"),
      student_id: formData.get("new_student_id"),
      initial_transaction: {
        type: formData.get("new_transaction_type"),
        amount: parseFloat(formData.get("new_transaction_amount")),
      },
    };

    try {
      const response = await fetch("/admin/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        alert("Error: " + result.error);
      } else {
        alert("Student added successfully.");
        addStudentForm.reset();
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    }
  });
});
