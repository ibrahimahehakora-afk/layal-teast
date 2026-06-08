document.addEventListener("DOMContentLoaded", () => {
  const concertCards = document.querySelectorAll(".concert-card");
  const bookingSection = document.getElementById("bookingSection");
  const bookingForm = document.getElementById("bookingForm");
  const eventDateField = document.getElementById("eventDate");
  const paymentRadios = Array.from(document.querySelectorAll('input[name="paymentMethod"]'));
  const cardFields = document.getElementById("cardFields");
  const statusBox = document.getElementById("bookingStatus");
  const cardInputs = Array.from(cardFields.querySelectorAll("input"));
  const guestsField = document.getElementById("guests");
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const nextStepBtn = document.getElementById("nextStep");
  const backStepBtn = document.getElementById("backStep");
  const selectedConcertName = document.getElementById("selectedConcertName");

  // ضع هنا مفتاح Stripe العام (Publishable key) من حسابك.
  // مثال: pk_test_51H... أو pk_live_51H...
  const stripePublicKey = "pk_test_XXXXXXXXXXXXXXXXXXXXXXXX";
  const stripe = Stripe(stripePublicKey);
  
  // استبدل معرفات الأسعار الخاصة بك من Stripe Price IDs.
  const stripePriceMap = {
    dubai: "price_12345Dubai",
    beirut: "price_12345Beirut",
    riyadh: "price_12345Riyadh"
  };
  
  let selectedEvent = null;

  // Handle concert selection
  concertCards.forEach(card => {
    const selectBtn = card.querySelector(".select-concert");
    selectBtn.addEventListener("click", () => {
      // Remove previous selection
      concertCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      
      selectedEvent = {
        id: card.dataset.eventId,
        date: card.dataset.date,
        name: card.querySelector("h3").textContent
      };
      
      selectedConcertName.textContent = selectedEvent.name;
      eventDateField.value = selectedEvent.date;
      
      // Show booking section
      bookingSection.style.display = "block";
      
      // Scroll to booking form
      setTimeout(() => {
        bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });
  });

  function validateGuests() {
    const guests = Number(guestsField.value);
    if (!guestsField.value || guests < 2) {
      guestsField.setCustomValidity('عدد الحضور يجب أن يكون 2 أو أكثر.');
    } else {
      guestsField.setCustomValidity('');
    }
  }

  function setCardRequirement(required) {
    cardInputs.forEach(input => {
      if (required) {
        input.setAttribute("required", "required");
      } else {
        input.removeAttribute("required");
      }
    });
  }

  function updatePaymentSection() {
    cardFields.style.display = "none";
  }

  function validateStep1() {
    const fields = Array.from(step1.querySelectorAll("input, select"));
    const invalidField = fields.find(field => !field.checkValidity());
    if (invalidField) {
      invalidField.reportValidity();
      return false;
    }
    return true;
  }

  function goToStep2() {
    if (!validateStep1()) return;
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    updatePaymentSection();
    statusBox.textContent = "";
  }

  function goToStep1() {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
    statusBox.textContent = "";
  }

  async function createCheckoutSession(payload) {
    // هذا هو رابط endpoint الخلفي الذي يجب إنشاؤه في خادمك.
    // إذا كان لديك رابط مختلف أو اسم مسار آخر، غيّره هنا.
    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("فشل إنشاء جلسة Stripe.");
    }

    return response.json();
  }

  paymentRadios.forEach(radio => radio.addEventListener("change", updatePaymentSection));
  guestsField.addEventListener("input", validateGuests);
  validateGuests();
  updatePaymentSection();

  nextStepBtn.addEventListener("click", goToStep2);
  backStepBtn.addEventListener("click", goToStep1);

  bookingForm.addEventListener("submit", async event => {
    event.preventDefault();
    statusBox.style.color = "#fff";
    statusBox.textContent = "جاري تجهيز بيانات الحجز...";

    if (!bookingForm.checkValidity()) {
      statusBox.style.color = "#f39a46";
      statusBox.textContent = "يرجى تعبئة جميع الحقول المطلوبة بدقة.";
      return;
    }

    if (!selectedEvent) {
      statusBox.style.color = "#f39a46";
      statusBox.textContent = "اختر الحفلة أولاً ثم حاول الدفع.";
      return;
    }

    const priceId = stripePriceMap[selectedEvent.id];
    if (!priceId) {
      statusBox.style.color = "#f39a46";
      statusBox.textContent = "لم يتم إعداد سعر Stripe لهذه الحفلة بعد.";
      return;
    }

    const formData = {
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      eventDate: selectedEvent.date,
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      venue: document.getElementById("venue").value,
      guests: Number(document.getElementById("guests").value),
      package: document.getElementById("package").value,
      paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
      priceId
    };

    try {
      const session = await createCheckoutSession(formData);
      statusBox.textContent = "جاري التحويل إلى Stripe...";
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      statusBox.style.color = "#f39a46";
      statusBox.textContent = error.message || "حدث خطأ أثناء الاتصال بـ Stripe.";
    }
  });
});
