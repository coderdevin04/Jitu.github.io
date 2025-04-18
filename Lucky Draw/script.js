// ================ Global Variables ================
let drawEndTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
let entries = JSON.parse(localStorage.getItem('drawEntries')) || [];
const MAX_ENTRIES = 1000;
const ENTRY_FEE = 99;

// ================ Countdown Timer ================
function updateCountdown() {
  const now = new Date().getTime();
  const timeLeft = drawEndTime - now;

  if (timeLeft < 0) {
    document.getElementById('timer').innerHTML = "Draw in Progress!";
    return;
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = days.toString().padStart(2, '0');
  document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
  document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
  document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

setInterval(updateCountdown, 1000);

// ================ Form Validation ================
function validateForm(formData) {
  const nameRegex = /^[a-zA-Z ]{2,30}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  if (!nameRegex.test(formData.name)) {
    showError('Please enter a valid name');
    return false;
  }

  if (!emailRegex.test(formData.email)) {
    showError('Please enter a valid email address');
    return false;
  }

  if (!phoneRegex.test(formData.phone)) {
    showError('Please enter a valid Indian phone number');
    return false;
  }

  return true;
}

// ================ Payment Integration (Razorpay) ================
async function initiatePayment(userData) {
  const options = {
    key: 'YOUR_RAZORPAY_KEY_HERE',
    amount: ENTRY_FEE * 100, // Paise conversion
    currency: 'INR',
    name: 'Tech Lucky Draw',
    description: 'Draw Entry Fee',
    prefill: {
      name: userData.name,
      email: userData.email,
      contact: userData.phone
    },
    theme: {
      color: '#7024f4'
    },
    handler: async function(response) {
      await handlePaymentSuccess(response, userData);
    },
    modal: {
      ondismiss: function() {
        showError('Payment cancelled');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

// ================ Payment Success Handler ================
async function handlePaymentSuccess(paymentResponse, userData) {
  try {
    const entry = {
      ...userData,
      paymentId: paymentResponse.razorpay_payment_id,
      timestamp: new Date().toISOString(),
      entryId: `ENTRY-${Date.now()}`
    };

    entries.push(entry);
    localStorage.setItem('drawEntries', JSON.stringify(entries));
    
    showSuccess('Payment successful! Entry registered');
    updateEntriesCounter();
    triggerConfetti();
  } catch (error) {
    console.error('Error processing payment:', error);
    showError('Error processing payment. Please contact support');
  }
}

// ================ Draw Winner Selection ================
function conductDraw() {
  if (entries.length === 0) {
    showError('No entries to draw from');
    return null;
  }

  // Provably fair random selection using crypto API
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const winnerIndex = randomBuffer[0] % entries.length;
  
  return entries[winnerIndex];
}

// ================ UI Helpers ================
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.remove();
  }, 5000);
}

function triggerConfetti() {
  // Basic confetti implementation
  const colors = ['#ff00ff', '#00f3ff', '#7024f4'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.borderRadius = '50%';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear`;

    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 5000);
  }
}

// ================ Entry Counter ================
function updateEntriesCounter() {
  const entriesLeft = MAX_ENTRIES - entries.length;
  document.querySelector('.notification-banner p').textContent = 
    `🔥 ${entriesLeft} entries remaining for current draw!`;
}

// ================ Form Submission Handler ================
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim()
  };

  if (!validateForm(formData)) return;

  if (entries.length >= MAX_ENTRIES) {
    showError('Draw is full. Please wait for next draw');
    return;
  }

  showLoading();
  try {
    await initiatePayment(formData);
  } catch (error) {
    showError('Payment failed. Please try again');
  } finally {
    hideLoading();
  }
});

// ================ Initialization ================
document.addEventListener('DOMContentLoaded', () => {
  updateEntriesCounter();
  updateCountdown();
  
  // Initialize winner list
  const winners = JSON.parse(localStorage.getItem('winners')) || [];
  renderWinnerList(winners);
});

// ================ Winner List Rendering ================
function renderWinnerList(winners) {
  const container = document.querySelector('.winner-cards');
  container.innerHTML = winners.map(winner => `
    <div class="winner">
      <div class="winner-avatar">🏆</div>
      <p class="winner-name">${winner.name}</p>
      <p class="won-item">${winner.prize}</p>
      <p class="win-date">${new Date(winner.timestamp).toLocaleDateString()}</p>
    </div>
  `).join('');
}

// Add this CSS for animations:
