// Backyard Ultra Training Plan Generator logic

// Utility: Select helper (shorter document.querySelector)
const $ = (sel) => document.querySelector(sel);

// Cache DOM elements we'll use multiple times
const generateBtn = $('#generateBtn');
const messagesEl = $('#messages');
const outputEl = $('#planOutput');

// Attach event listeners
generateBtn.addEventListener('click', handleGenerate);

/**
 * Handle clicking the Generate Plan button.
 * Performs validation and, if valid, builds a placeholder training plan output.
 */
function handleGenerate() {
  clearMessages();
  const data = collectFormData();
  console.log(data);
  const errors = validateDataInput(data);
  if (errors.length) {
    showErrors(errors);
    return;
  }
  const plan = buildPlaceholderPlan(data);
  renderPlan(plan, data);
  focusMessages();
}

/**
 * Collect values from the form.
 * @returns {Object} structured form data
 */
function collectFormData() {
  const targetDate = $('#targetDate').value ? new Date($('#targetDate').value) : null;
  const planLengthWeeks = parseInt($('#planLength').value, 10);
  const avgHours = parseFloat($('#avgHours').value);
  const dayCheckboxes = Array.from(document.querySelectorAll('input[name="days"]'));
  const selectedDays = dayCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
  return { targetDate, planLengthWeeks, avgHours, selectedDays };
}

/**
 * Validate the collected data and return an array of error messages.
 * @param {Object} data
 * @returns {string[]} errors
 */
function validateDataInput(data) {
  const errors = [];

  // Target date must exist and be in the future
  if (!data.targetDate) {
    errors.push('Please select a target backyard ultra date.');
  }

  // Plan length must be one of expected values
  if (![8, 12, 16].includes(data.planLengthWeeks)) {
    errors.push('Please select a training plan length (8, 12, or 16 weeks).');
  }

  // Average hours numeric and logical
  if (isNaN(data.avgHours) || data.avgHours <= 0) {
    errors.push('Average weekly training hours must be a positive number.');
  } else if (data.avgHours < 6) {
    errors.push('Average weekly training is lower than the minimum of 6 hrs.');
  }

  // At least one day selected
  if (!data.selectedDays.length) {
    errors.push('Select at least one training day.');
  } else if (data.selectedDays.length < 3) {
    errors.push('Number of selected days is lower than the minimum of 3.');
  } else if (!data.selectedDays.includes("Thu") && !data.selectedDays.includes("Sat") && !data.selectedDays.includes("Sun")) {
      errors.push('Please include one between Tuesday, Saturday or Sunday as a training day to accommodate long runs.');
  }

  // Rough feasibility: average vs number of days.
  if (data.selectedDays.length && !isNaN(data.avgHours)) {
    const perDayAvg = data.avgHours / data.selectedDays.length;
    if (perDayAvg < 1.5) {
      errors.push('The desired average running time per running day should be at least 1.5. Consider adjusting days or hours.');
    } else if (perDayAvg > 3.5) {
      errors.push('The desired average running time per running day should be at less than 3.5. Consider adjusting days or hours.');
    }
  }

  return errors;
}

/**
 * Build a placeholder plan data structure. Later this can be replaced with full algorithm.
 * @param {Object} data
 * @returns {Object} plan summary
 */
function buildPlaceholderPlan(data) {
  // Compute plan start date = targetDate - (planLengthWeeks * 7) days
  const startDate = new Date(data.targetDate.getTime());
  startDate.setDate(startDate.getDate() - data.planLengthWeeks * 7);

  // Simple weekly progression: all weeks use avgHours
  const weeks = [];
  for (let w = 0; w < data.planLengthWeeks; w++) {
    weeks.push({ weekNumber: w + 1, plannedHours: round1(data.avgHours) });
  }

  return { startDate, weeks };
}


// Util functions

/** Round to 0.1 */
function round1(v) { return Math.round(v * 10) / 10; }

/** Display the plan in the output element */
function renderPlan(plan, data) {
  const startStr = formatDate(plan.startDate);
  const targetStr = formatDate(data.targetDate);
  const weeksHtml = plan.weeks.map(w => `<tr><td>Week ${w.weekNumber}</td><td>${w.plannedHours} h</td></tr>`).join('');

  outputEl.innerHTML = `
    <div class="plan-summary">
      <p><strong>Target race:</strong> ${targetStr}</p>
      <p><strong>Plan length:</strong> ${data.planLengthWeeks} weeks (starts ${startStr})</p>
      <p><strong>Training days selected:</strong> ${data.selectedDays.join(', ')}</p>
      <p><strong>Avg weekly hours:</strong> ${data.avgHours}</p>
    </div>
    <table class="plan-table" aria-describedby="plan-output-heading">
      <thead><tr><th scope="col">Week</th><th scope="col">Planned Hours</th></tr></thead>
      <tbody>${weeksHtml}</tbody>
    </table>
    <p class="placeholder-note">All weeks use the same average weekly hours. Will refine algorithm later.</p>
  `;
}

/** Create and display error messages */
function showErrors(errors) {
  messagesEl.classList.remove('success');
  messagesEl.classList.add('error');
  messagesEl.innerHTML = `<ul>${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`;
}

/** Clear message area */
function clearMessages() {
  messagesEl.className = 'messages';
  messagesEl.innerHTML = '';
}

/** Focus message region for accessibility after update */
function focusMessages() {
  messagesEl.focus();
}

/** Escape HTML to avoid injection in dynamic content */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/** Format date as YYYY-MM-DD */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${da}-${m}-${y}`;
}

// Optional: Close details when ESC pressed while focused inside content
const usageGuide = document.querySelector('.usage-guide');
usageGuide?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    usageGuide.open = false;
  }
});

// Collapsible instructions section logic
const toggleGuideBtn = document.getElementById('toggleGuideBtn');
const guideContent = document.getElementById('guideContent');

if (toggleGuideBtn && guideContent) {
  toggleGuideBtn.addEventListener('click', () => {
    const isOpen = !guideContent.hidden;
    guideContent.hidden = isOpen;
    toggleGuideBtn.setAttribute('aria-expanded', String(!isOpen));
    toggleGuideBtn.textContent = isOpen ? 'Show instructions' : 'Hide instructions';
  });
}
