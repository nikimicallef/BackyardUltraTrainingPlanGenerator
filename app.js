// Backyard Ultra Training Plan Generator logic
// This file contains only front-end JavaScript: no external dependencies.

// Utility: Select helper (shorter document.querySelector)
const $ = (sel) => document.querySelector(sel);

// Cache DOM elements we'll use multiple times
const form = $('#plan-form');
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
  const errors = validate(data);
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
  const peakHours = parseFloat($('#peakHours').value);
  const dayCheckboxes = Array.from(document.querySelectorAll('input[name="days"]'));
  const selectedDays = dayCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
  return { targetDate, planLengthWeeks, avgHours, peakHours, selectedDays };
}

/**
 * Validate the collected data and return an array of error messages.
 * @param {Object} data
 * @returns {string[]} errors
 */
function validate(data) {
  const errors = [];
  const now = new Date();

  // Target date must exist and be in the future
  if (!data.targetDate) {
    errors.push('Please select a target backyard ultra date.');
  } else {
    // Compare only date portion (ignore time). Set hours to 0 for both for robust comparison
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetMidnight = new Date(data.targetDate.getFullYear(), data.targetDate.getMonth(), data.targetDate.getDate());
    if (targetMidnight <= todayMidnight) {
      errors.push('Target date must be in the future.');
    }
  }

  // Plan length must be one of expected values
  if (![8, 12, 16].includes(data.planLengthWeeks)) {
    errors.push('Please select a training plan length (8, 12, or 16 weeks).');
  }

  // Hours numeric and logical
  if (isNaN(data.avgHours) || data.avgHours <= 0) {
    errors.push('Average weekly training hours must be a positive number.');
  }
  if (isNaN(data.peakHours) || data.peakHours <= 0) {
    errors.push('Peak weekly training hours must be a positive number.');
  }
  if (!isNaN(data.avgHours) && !isNaN(data.peakHours) && data.peakHours < data.avgHours) {
    errors.push('Peak weekly hours should be greater than or equal to average weekly hours.');
  }

  // At least one day selected
  if (!data.selectedDays.length) {
    errors.push('Select at least one training day.');
  }

  // Rough feasibility: average vs number of days (optional heuristic). Example: if avgHours/selectedDays < 0.25 maybe warn.
  if (data.selectedDays.length && !isNaN(data.avgHours)) {
    const perDayAvg = data.avgHours / data.selectedDays.length;
    if (perDayAvg < 0.25) {
      errors.push('Average hours per selected training day is very low (<0.25h). Consider adjusting days or hours.');
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

  // Simple weekly progression placeholder: ramp from avgHours to peakHours mid-plan then taper.
  const weeks = [];
  const totalWeeks = data.planLengthWeeks;
  const peakWeekIndex = Math.floor(totalWeeks * 0.65); // When peak occurs
  for (let w = 0; w < totalWeeks; w++) {
    let plannedHours;
    if (w < peakWeekIndex) {
      // Linear ramp
      plannedHours = interpolate(w, 0, peakWeekIndex, data.avgHours, data.peakHours);
    } else if (w === peakWeekIndex) {
      plannedHours = data.peakHours;
    } else {
      // Taper down 20% each week after peak until not below avgHours
      const taperFactor = Math.pow(0.8, w - peakWeekIndex);
      plannedHours = Math.max(data.avgHours, data.peakHours * taperFactor);
    }
    weeks.push({ weekNumber: w + 1, plannedHours: round1(plannedHours) });
  }

  return { startDate, weeks };
}

/** Utility linear interpolation */
function interpolate(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
}

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
      <p><strong>Avg / Peak weekly hours:</strong> ${data.avgHours} / ${data.peakHours}</p>
    </div>
    <table class="plan-table" aria-describedby="plan-output-heading">
      <thead><tr><th scope="col">Week</th><th scope="col">Planned Hours</th></tr></thead>
      <tbody>${weeksHtml}</tbody>
    </table>
    <p class="placeholder-note">Placeholder distribution. Will refine algorithm later.</p>
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
  return `${y}-${m}-${da}`;
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
