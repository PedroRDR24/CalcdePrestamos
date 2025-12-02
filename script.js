// ===== CONSTANTS =====
const RATES = {
    'N': { 12: 0.58 },
    'A': { 12: 0.45, 18: 0.675, 24: 0.92 }
};

const LIMITS = {
    'N': { min: 1000, max: 10000 },
    'A': { min: 1000, max: 50000 }
};

const TERM_LIMITS = {
    12: { min: 1000, max: 35000 },
    18: { min: 4000, max: 35000 },
    24: { min: 4000, max: 50000 }
};

const SECTION_TITLES = {
    'section1': 'Calcula tu préstamo ideal',
    'section2': 'Interés diario del préstamo',
    'section3': 'Liquidación anticipada',
    'section4': 'Sobrepréstamo'
};

// ===== SIDEBAR & NAVIGATION =====
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const closeSidebar = document.getElementById('closeSidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const sectionTitle = document.getElementById('sectionTitle');

    // Toggle Sidebar
    hamburger.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeSidebar.addEventListener('click', closeSidebarFn);
    overlay.addEventListener('click', closeSidebarFn);

    function closeSidebarFn() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Section Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active section
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetSection).classList.add('active');

            // Update title
            sectionTitle.textContent = SECTION_TITLES[targetSection];

            // Close sidebar
            closeSidebarFn();
        });
    });

    // ===== SECTION 1: LOAN CALCULATOR =====
    initSection1();

    // ===== SECTION 2: DAILY INTEREST CALCULATOR =====
    initSection2();

    // ===== SECTION 3: EARLY PAYOFF CALCULATOR =====
    initSection3();

    // ===== SECTION 4: OVER-LOAN CALCULATOR =====
    initSection4();
});

// ===== SECTION 1: LOAN CALCULATOR =====
function initSection1() {
    const state = {
        clientType: 'N',
        amount: 0,
        term: 12
    };

    const typeInputs = document.querySelectorAll('input[name="clientType1"]');
    const amountInput = document.getElementById('amount1');
    const amountHelper = document.getElementById('amountHelper1');
    const termInputs = document.querySelectorAll('input[name="term1"]');
    const btnCalculate = document.getElementById('btnCalculate1');
    const btnCalculateAll = document.getElementById('btnCalculateAll1');
    const resultsSection = document.getElementById('resultsSection1');
    const resultsList = document.getElementById('resultsList1');

    const termLabels = {
        12: document.querySelector('label[for="term12_1"] .term-rate'),
        18: document.querySelector('label[for="term18_1"] .term-rate'),
        24: document.querySelector('label[for="term24_1"] .term-rate')
    };

    updateUIConstraints();

    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.clientType = e.target.value;
            validateAmount();
            updateUIConstraints();
            clearResults();
        });
    });

    amountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.amount = isNaN(val) ? 0 : val;
        validateAmount();
        handleSpecialAmountRules();
    });

    termInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.term = parseInt(e.target.value);
        });
    });

    btnCalculate.addEventListener('click', () => {
        if (!isValid()) return;
        renderResults([state.term]);
    });

    btnCalculateAll.addEventListener('click', () => {
        if (!isValid()) return;
        let termsToCalc = [];
        if (state.clientType === 'N') {
            termsToCalc = [12];
        } else {
            if (state.amount === 50000) {
                termsToCalc = [24];
            } else {
                termsToCalc = [12, 18, 24];
            }
        }
        renderResults(termsToCalc);
    });

    function updateUIConstraints() {
        const isNew = state.clientType === 'N';
        const limits = LIMITS[state.clientType];

        amountHelper.textContent = `Mín: $${limits.min.toLocaleString()} - Máx: $${limits.max.toLocaleString()}`;
        amountInput.placeholder = `${limits.min} - ${limits.max}`;

        if (isNew) {
            setTermDisabled(18, true);
            setTermDisabled(24, true);
            selectTerm(12);
            termLabels[12].textContent = '58%';
        } else {
            setTermDisabled(18, false);
            setTermDisabled(24, false);
            termLabels[12].textContent = '45%';
            termLabels[18].textContent = '67.5%';
            termLabels[24].textContent = '92%';
            handleSpecialAmountRules();
        }
    }

    function handleSpecialAmountRules() {
        if (state.clientType === 'A') {
            // 50k must be 24 months
            if (state.amount === 50000) {
                setTermDisabled(12, true);
                setTermDisabled(18, true);
                selectTerm(24);
            }
            // Less than 4k can only be 12 months
            else if (state.amount > 0 && state.amount < 4000) {
                setTermDisabled(18, true);
                setTermDisabled(24, true);
                if (state.term !== 12) {
                    selectTerm(12);
                }
            }
            // 4k+ enables all terms (respecting max limits per term)
            else if (state.amount >= 4000) {
                setTermDisabled(12, false);
                setTermDisabled(18, false);
                setTermDisabled(24, false);
            }
            // Default: enable all
            else {
                setTermDisabled(12, false);
                setTermDisabled(18, false);
                setTermDisabled(24, false);
            }
        }
        validateAmount();
    }

    function validateAmount() {
        const limits = LIMITS[state.clientType];
        const termLimits = TERM_LIMITS[state.term];
        const val = state.amount;

        // Check general client type limits first
        if (val < limits.min || val > limits.max) {
            amountHelper.classList.add('error');
            return false;
        }

        // Check term-specific limits for Client A
        if (state.clientType === 'A') {
            if (val < termLimits.min || val > termLimits.max) {
                amountHelper.classList.add('error');
                amountHelper.textContent = `Para ${state.term} meses: Mín $${termLimits.min.toLocaleString()} - Máx $${termLimits.max.toLocaleString()}`;
                return false;
            }
        }

        amountHelper.classList.remove('error');
        amountHelper.textContent = `Mín: $${limits.min.toLocaleString()} - Máx: $${limits.max.toLocaleString()}`;
        return true;
    }

    function isValid() {
        if (!state.amount) {
            alert('Por favor ingresa un monto.');
            return false;
        }
        if (!validateAmount()) {
            alert(`El monto debe estar entre $${LIMITS[state.clientType].min.toLocaleString()} y $${LIMITS[state.clientType].max.toLocaleString()}`);
            return false;
        }
        return true;
    }

    function setTermDisabled(termVal, disabled) {
        const input = document.getElementById(`term${termVal}_1`);
        input.disabled = disabled;
        if (disabled && input.checked) {
            input.checked = false;
        }
    }

    function selectTerm(termVal) {
        const input = document.getElementById(`term${termVal}_1`);
        input.disabled = false;
        input.checked = true;
        state.term = termVal;
    }

    function calculate(amount, term, type) {
        const rate = RATES[type][term];
        const interest = Math.round(amount * rate);
        const total = amount + interest;
        const monthlyPayment = Math.round(total / term);
        return { amount, term, rate, interest, total, monthlyPayment };
    }

    function renderResults(terms) {
        resultsList.innerHTML = '';
        resultsSection.classList.remove('hidden');

        terms.forEach(term => {
            const data = calculate(state.amount, term, state.clientType);
            const card = document.createElement('div');
            card.className = 'result-card';

            card.innerHTML = `
                <div class="result-row">
                    <span class="result-badge">${data.term} Meses</span>
                    <span>Tasa: ${(data.rate * 100).toFixed(1)}%</span>
                </div>
                <div class="result-row">
                    <span>Préstamo:</span>
                    <span>$${data.amount.toLocaleString()}</span>
                </div>
                <div class="result-row">
                    <span>Interés:</span>
                    <span>$${data.interest.toLocaleString()}</span>
                </div>
                <div class="result-row">
                    <span>Mensualidad:</span>
                    <span>$${data.monthlyPayment.toLocaleString()}</span>
                </div>
                <div class="result-row total">
                    <span>Total a Pagar:</span>
                    <span>$${data.total.toLocaleString()}</span>
                </div>
            `;
            resultsList.appendChild(card);
        });

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function clearResults() {
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';
    }
}

// ===== SECTION 2: DAILY INTEREST CALCULATOR =====
function initSection2() {
    const state = {
        clientType: 'N',
        amount: 0,
        term: 12
    };

    const typeInputs = document.querySelectorAll('input[name="clientType2"]');
    const amountInput = document.getElementById('amount2');
    const amountHelper = document.getElementById('amountHelper2');
    const termInputs = document.querySelectorAll('input[name="term2"]');
    const btnCalculate = document.getElementById('btnCalculate2');
    const resultsSection = document.getElementById('resultsSection2');
    const resultsList = document.getElementById('resultsList2');

    const termLabels = {
        12: document.querySelector('label[for="term12_2"] .term-rate'),
        18: document.querySelector('label[for="term18_2"] .term-rate'),
        24: document.querySelector('label[for="term24_2"] .term-rate')
    };

    updateUIConstraints();

    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.clientType = e.target.value;
            validateAmount();
            updateUIConstraints();
            clearResults();
        });
    });

    amountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.amount = isNaN(val) ? 0 : val;
        validateAmount();
        handleSpecialAmountRules();
    });

    termInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.term = parseInt(e.target.value);
        });
    });

    btnCalculate.addEventListener('click', () => {
        if (!isValid()) return;
        renderResults();
    });

    function updateUIConstraints() {
        const isNew = state.clientType === 'N';
        const limits = LIMITS[state.clientType];

        amountHelper.textContent = `Mín: $${limits.min.toLocaleString()} - Máx: $${limits.max.toLocaleString()}`;
        amountInput.placeholder = `${limits.min} - ${limits.max}`;

        if (isNew) {
            setTermDisabled(18, true);
            setTermDisabled(24, true);
            selectTerm(12);
            termLabels[12].textContent = '58%';
        } else {
            setTermDisabled(18, false);
            setTermDisabled(24, false);
            termLabels[12].textContent = '45%';
            termLabels[18].textContent = '67.5%';
            termLabels[24].textContent = '92%';
            handleSpecialAmountRules();
        }
    }

    function handleSpecialAmountRules() {
        if (state.clientType === 'A' && state.amount === 50000) {
            setTermDisabled(12, true);
            setTermDisabled(18, true);
            selectTerm(24);
        } else if (state.clientType === 'A') {
            setTermDisabled(12, false);
            setTermDisabled(18, false);
        }
    }

    function validateAmount() {
        const limits = LIMITS[state.clientType];
        const val = state.amount;

        if (val < limits.min || val > limits.max) {
            amountHelper.classList.add('error');
            return false;
        } else {
            amountHelper.classList.remove('error');
            return true;
        }
    }

    function isValid() {
        if (!state.amount) {
            alert('Por favor ingresa un monto.');
            return false;
        }
        if (!validateAmount()) {
            alert(`El monto debe estar entre $${LIMITS[state.clientType].min.toLocaleString()} y $${LIMITS[state.clientType].max.toLocaleString()}`);
            return false;
        }
        return true;
    }

    function setTermDisabled(termVal, disabled) {
        const input = document.getElementById(`term${termVal}_2`);
        input.disabled = disabled;
        if (disabled && input.checked) {
            input.checked = false;
        }
    }

    function selectTerm(termVal) {
        const input = document.getElementById(`term${termVal}_2`);
        input.disabled = false;
        input.checked = true;
        state.term = termVal;
    }

    function calculateDailyInterest() {
        const rate = RATES[state.clientType][state.term];
        const annualInterest = state.amount * rate;
        const dailyInterest = Math.round(annualInterest / 360);
        return { amount: state.amount, term: state.term, rate, dailyInterest };
    }

    function renderResults() {
        resultsList.innerHTML = '';
        resultsSection.classList.remove('hidden');

        const data = calculateDailyInterest();
        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="result-row">
                <span class="result-badge">${data.term} Meses</span>
                <span>Tasa: ${(data.rate * 100).toFixed(1)}%</span>
            </div>
            <div class="result-row">
                <span>Monto del Préstamo:</span>
                <span>$${data.amount.toLocaleString()}</span>
            </div>
            <div class="result-row total">
                <span>Interés Diario:</span>
                <span>$${data.dailyInterest.toLocaleString()}</span>
            </div>
        `;
        resultsList.appendChild(card);

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function clearResults() {
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';
    }
}

// ===== SECTION 3: EARLY PAYOFF CALCULATOR =====
function initSection3() {
    const state = {
        clientType: 'N',
        amount: 0,
        term: 12,
        loanDate: null,
        payoffDate: null,
        hasCurrentMonthPayment: false
    };

    const typeInputs = document.querySelectorAll('input[name="clientType3"]');
    const amountInput = document.getElementById('amount3');
    const amountHelper = document.getElementById('amountHelper3');
    const termInputs = document.querySelectorAll('input[name="term3"]');
    const loanDateInput = document.getElementById('loanDate');
    const payoffDateInput = document.getElementById('payoffDate');
    const paymentStatusContainer = document.getElementById('paymentStatusContainer');
    const paymentStatusInputs = document.querySelectorAll('input[name="paymentStatus"]');
    const btnCalculate = document.getElementById('btnCalculate3');
    const resultsSection = document.getElementById('resultsSection3');
    const resultsList = document.getElementById('resultsList3');

    const termLabels = {
        12: document.querySelector('label[for="term12_3"] .term-rate'),
        18: document.querySelector('label[for="term18_3"] .term-rate'),
        24: document.querySelector('label[for="term24_3"] .term-rate')
    };

    updateUIConstraints();

    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.clientType = e.target.value;
            validateAmount();
            updateUIConstraints();
            clearResults();
        });
    });

    amountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.amount = isNaN(val) ? 0 : val;
        validateAmount();
        handleSpecialAmountRules();
    });

    termInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.term = parseInt(e.target.value);
        });
    });

    loanDateInput.addEventListener('change', (e) => {
        state.loanDate = e.target.value;
        updatePaymentStatusVisibility();
    });

    payoffDateInput.addEventListener('change', (e) => {
        state.payoffDate = e.target.value;
        updatePaymentStatusVisibility();
    });

    paymentStatusInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.hasCurrentMonthPayment = e.target.value === 'yes';
        });
    });

    btnCalculate.addEventListener('click', () => {
        if (!isValid()) return;
        renderResults();
    });

    function updatePaymentStatusVisibility() {
        if (!state.loanDate || !state.payoffDate) {
            paymentStatusContainer.classList.add('hidden');
            return;
        }

        const loanDate = new Date(state.loanDate);
        const payoffDate = new Date(state.payoffDate);

        // Find the nearest payment date at or after the payoff date
        let paymentDate = new Date(loanDate);
        let nearestPaymentDate = null;

        while (paymentDate <= payoffDate) {
            paymentDate.setMonth(paymentDate.getMonth() + 1);
        }
        nearestPaymentDate = new Date(paymentDate);

        // Calculate days since this payment date
        const daysSincePayment = Math.ceil((payoffDate - nearestPaymentDate) / (1000 * 60 * 60 * 24));

        // Show payment status question only if we're within 20 days BEFORE the payment date
        // (If more than 20 days after, it will be auto-counted)
        if (daysSincePayment < 0 && daysSincePayment >= -20) {
            paymentStatusContainer.classList.remove('hidden');
        } else {
            paymentStatusContainer.classList.add('hidden');
            document.getElementById('paymentNo').checked = true;
            state.hasCurrentMonthPayment = false;
        }
    }

    function updateUIConstraints() {
        const isNew = state.clientType === 'N';
        const limits = LIMITS[state.clientType];

        amountHelper.textContent = `Mín: $${limits.min.toLocaleString()} - Máx: $${limits.max.toLocaleString()}`;
        amountInput.placeholder = `${limits.min} - ${limits.max}`;

        if (isNew) {
            setTermDisabled(18, true);
            setTermDisabled(24, true);
            selectTerm(12);
            termLabels[12].textContent = '58%';
        } else {
            setTermDisabled(18, false);
            setTermDisabled(24, false);
            termLabels[12].textContent = '45%';
            termLabels[18].textContent = '67.5%';
            termLabels[24].textContent = '92%';
            handleSpecialAmountRules();
        }
    }

    function handleSpecialAmountRules() {
        if (state.clientType === 'A' && state.amount === 50000) {
            setTermDisabled(12, true);
            setTermDisabled(18, true);
            selectTerm(24);
        } else if (state.clientType === 'A') {
            setTermDisabled(12, false);
            setTermDisabled(18, false);
        }
    }

    function validateAmount() {
        const limits = LIMITS[state.clientType];
        const val = state.amount;

        if (val < limits.min || val > limits.max) {
            amountHelper.classList.add('error');
            return false;
        } else {
            amountHelper.classList.remove('error');
            return true;
        }
    }

    function isValid() {
        if (!state.amount) {
            alert('Por favor ingresa un monto.');
            return false;
        }
        if (!validateAmount()) {
            alert(`El monto debe estar entre $${LIMITS[state.clientType].min.toLocaleString()} y $${LIMITS[state.clientType].max.toLocaleString()}`);
            return false;
        }
        if (!state.loanDate) {
            alert('Por favor selecciona la fecha del préstamo.');
            return false;
        }
        if (!state.payoffDate) {
            alert('Por favor selecciona la fecha de liquidación.');
            return false;
        }

        const loanDate = new Date(state.loanDate);
        const payoffDate = new Date(state.payoffDate);

        if (payoffDate < loanDate) {
            alert('La fecha de liquidación debe ser posterior o igual a la fecha del préstamo.');
            return false;
        }

        return true;
    }

    function setTermDisabled(termVal, disabled) {
        const input = document.getElementById(`term${termVal}_3`);
        input.disabled = disabled;
        if (disabled && input.checked) {
            input.checked = false;
        }
    }

    function selectTerm(termVal) {
        const input = document.getElementById(`term${termVal}_3`);
        input.disabled = false;
        input.checked = true;
        state.term = termVal;
    }

    function calculateEarlyPayoff() {
        const rate = RATES[state.clientType][state.term];
        const totalInterest = state.amount * rate;
        const totalAmount = state.amount + totalInterest;
        const monthlyPayment = Math.round(totalAmount / state.term);

        // Calculate daily interest using 360-day year
        const dailyInterest = totalInterest / 360;

        const loanDate = new Date(state.loanDate);
        const payoffDate = new Date(state.payoffDate);

        const diffTime = Math.abs(payoffDate - loanDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate accrued interest, but cap it at total interest
        // This prevents showing more interest than the loan's total when using 360-day formula
        const calculatedInterest = dailyInterest * diffDays;
        const accruedInterest = Math.round(Math.min(calculatedInterest, totalInterest));

        // Calculate how many payment dates have passed (with 20-day rule)
        let paymentsMade = 0;
        let paymentDate = new Date(loanDate);

        while (true) {
            // Move to next payment date (add 1 month)
            paymentDate.setMonth(paymentDate.getMonth() + 1);

            const daysSincePayment = Math.ceil((payoffDate - paymentDate) / (1000 * 60 * 60 * 24));

            // If payment date is more than 20 days in the past, count it automatically
            if (daysSincePayment >= 20) {
                paymentsMade++;
            }
            // If payment date is within 20 days (before or after), check user confirmation
            else if (daysSincePayment >= -20 && daysSincePayment < 20) {
                if (state.hasCurrentMonthPayment) {
                    paymentsMade++;
                }
                break;
            }
            // If payment date is more than 20 days in the future, stop
            else {
                break;
            }
        }

        const totalPaid = paymentsMade * monthlyPayment;
        const remainingBalance = state.amount + accruedInterest - totalPaid;
        const totalPayoff = Math.max(0, remainingBalance);

        return {
            amount: state.amount,
            term: state.term,
            rate,
            dailyInterest: Math.round(dailyInterest),
            daysElapsed: diffDays,
            accruedInterest,
            monthlyPayment,
            paymentsMade,
            totalPaid,
            totalPayoff
        };
    }

    function renderResults() {
        resultsList.innerHTML = '';
        resultsSection.classList.remove('hidden');

        const data = calculateEarlyPayoff();
        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="result-row">
                <span class="result-badge">${data.term} Meses</span>
                <span>Tasa: ${(data.rate * 100).toFixed(1)}%</span>
            </div>
            <div class="result-row">
                <span>Monto del Préstamo:</span>
                <span>$${data.amount.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Mensualidad:</span>
                <span>$${data.monthlyPayment.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Días Transcurridos:</span>
                <span>${data.daysElapsed} días</span>
            </div>
            <div class="result-row">
                <span>Interés Diario:</span>
                <span>$${data.dailyInterest.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Interés Acumulado:</span>
                <span>$${data.accruedInterest.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Pagos Realizados:</span>
                <span>${data.paymentsMade} de ${data.term} ($${(data.totalPaid).toLocaleString()} MXN)</span>
            </div>
            <div class="result-row total">
                <span>Total a Liquidar:</span>
                <span>$${data.totalPayoff.toLocaleString()}</span>
            </div>
        `;
        resultsList.appendChild(card);

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function clearResults() {
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';
    }
}

// ===== SECTION 4: OVER-LOAN CALCULATOR =====
function initSection4() {
    const state = {
        clientType: 'N',
        prevAmount: 0,
        prevTerm: 12,
        prevLoanDate: null,
        currentDate: null,
        newAmount: 0,
        newTerm: 12,
        hasCurrentMonthPayment: false
    };

    const typeInputs = document.querySelectorAll('input[name="clientType4"]');
    const prevAmountInput = document.getElementById('prevAmount');
    const prevAmountHelper = document.getElementById('prevAmountHelper');
    const prevTermInputs = document.querySelectorAll('input[name="prevTerm"]');
    const prevLoanDateInput = document.getElementById('prevLoanDate');
    const currentDateInput = document.getElementById('currentDate');
    const paymentStatusContainer4 = document.getElementById('paymentStatusContainer4');
    const paymentStatusInputs4 = document.querySelectorAll('input[name="paymentStatus4"]');
    const newAmountInput = document.getElementById('newAmount');
    const newAmountHelper = document.getElementById('newAmountHelper');
    const newTermInputs = document.querySelectorAll('input[name="newTerm"]');
    const btnCalculate = document.getElementById('btnCalculate4');
    const resultsSection = document.getElementById('resultsSection4');
    const resultsList = document.getElementById('resultsList4');

    const prevTermLabels = {
        12: document.querySelector('label[for="prevTerm12"] .term-rate'),
        18: document.querySelector('label[for="prevTerm18"] .term-rate'),
        24: document.querySelector('label[for="prevTerm24"] .term-rate')
    };

    const newTermLabels = {
        12: document.querySelector('label[for="newTerm12"] .term-rate'),
        18: document.querySelector('label[for="newTerm18"] .term-rate'),
        24: document.querySelector('label[for="newTerm24"] .term-rate')
    };

    updateUIConstraints();

    typeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.clientType = e.target.value;
            updateUIConstraints();
            clearResults();
        });
    });

    prevAmountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.prevAmount = isNaN(val) ? 0 : val;
        validatePrevAmount();
        handlePrevSpecialRules();
    });

    prevTermInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.prevTerm = parseInt(e.target.value);
        });
    });

    prevLoanDateInput.addEventListener('change', (e) => {
        state.prevLoanDate = e.target.value;
        updatePaymentStatusVisibility4();
    });

    currentDateInput.addEventListener('change', (e) => {
        state.currentDate = e.target.value;
        updatePaymentStatusVisibility4();
    });

    if (paymentStatusInputs4) {
        paymentStatusInputs4.forEach(input => {
            input.addEventListener('change', (e) => {
                state.hasCurrentMonthPayment = e.target.value === 'yes';
            });
        });
    }

    newAmountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.newAmount = isNaN(val) ? 0 : val;
    });

    newTermInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.newTerm = parseInt(e.target.value);
        });
    });

    btnCalculate.addEventListener('click', () => {
        if (!isValid()) return;
        renderResults();
    });

    function updatePaymentStatusVisibility4() {
        if (!paymentStatusContainer4) return;

        if (!state.prevLoanDate || !state.currentDate) {
            paymentStatusContainer4.classList.add('hidden');
            return;
        }

        const loanDate = new Date(state.prevLoanDate);
        const currentDate = new Date(state.currentDate);

        // Find the nearest payment date at or after the current date
        let paymentDate = new Date(loanDate);

        while (paymentDate <= currentDate) {
            paymentDate.setMonth(paymentDate.getMonth() + 1);
        }

        // Calculate days since this payment date
        const daysSincePayment = Math.ceil((currentDate - paymentDate) / (1000 * 60 * 60 * 24));

        // Show payment status question only if we're within 20 days BEFORE the payment date
        if (daysSincePayment < 0 && daysSincePayment >= -20) {
            paymentStatusContainer4.classList.remove('hidden');
        } else {
            paymentStatusContainer4.classList.add('hidden');
            const paymentNo4 = document.getElementById('payment4No');
            if (paymentNo4) paymentNo4.checked = true;
            state.hasCurrentMonthPayment = false;
        }
    }

    function updateUIConstraints() {
        const isNew = state.clientType === 'N';
        const limits = LIMITS[state.clientType];

        prevAmountHelper.textContent = `Mín: $${limits.min.toLocaleString()} - Máx: $${limits.max.toLocaleString()}`;
        prevAmountInput.placeholder = `${limits.min} - ${limits.max}`;

        if (isNew) {
            setPrevTermDisabled(18, true);
            setPrevTermDisabled(24, true);
            selectPrevTerm(12);
            prevTermLabels[12].textContent = '58%';

            setNewTermDisabled(18, true);
            setNewTermDisabled(24, true);
            selectNewTerm(12);
            newTermLabels[12].textContent = '58%';
        } else {
            setPrevTermDisabled(18, false);
            setPrevTermDisabled(24, false);
            prevTermLabels[12].textContent = '45%';
            prevTermLabels[18].textContent = '67.5%';
            prevTermLabels[24].textContent = '92%';

            setNewTermDisabled(18, false);
            setNewTermDisabled(24, false);
            newTermLabels[12].textContent = '45%';
            newTermLabels[18].textContent = '67.5%';
            newTermLabels[24].textContent = '92%';

            handlePrevSpecialRules();
        }
    }

    function handlePrevSpecialRules() {
        if (state.clientType === 'A' && state.prevAmount === 50000) {
            setPrevTermDisabled(12, true);
            setPrevTermDisabled(18, true);
            selectPrevTerm(24);
        } else if (state.clientType === 'A') {
            setPrevTermDisabled(12, false);
            setPrevTermDisabled(18, false);
        }
    }

    function validatePrevAmount() {
        const limits = LIMITS[state.clientType];
        const val = state.prevAmount;

        if (val < limits.min || val > limits.max) {
            prevAmountHelper.classList.add('error');
            return false;
        } else {
            prevAmountHelper.classList.remove('error');
            return true;
        }
    }

    function isValid() {
        if (!state.prevAmount) {
            alert('Por favor ingresa el monto del préstamo anterior.');
            return false;
        }
        if (!validatePrevAmount()) {
            alert(`El monto anterior debe estar entre $${LIMITS[state.clientType].min.toLocaleString()} y $${LIMITS[state.clientType].max.toLocaleString()}`);
            return false;
        }
        if (!state.prevLoanDate) {
            alert('Por favor selecciona la fecha del préstamo anterior.');
            return false;
        }
        if (!state.currentDate) {
            alert('Por favor selecciona la fecha de liquidación.');
            return false;
        }
        if (!state.newAmount) {
            alert('Por favor ingresa el monto nuevo a prestar.');
            return false;
        }

        const prevDate = new Date(state.prevLoanDate);
        const currDate = new Date(state.currentDate);

        if (currDate < prevDate) {
            alert('La fecha de liquidación debe ser posterior o igual a la fecha del préstamo anterior.');
            return false;
        }

        return true;
    }

    function setPrevTermDisabled(termVal, disabled) {
        const input = document.getElementById(`prevTerm${termVal}`);
        input.disabled = disabled;
        if (disabled && input.checked) {
            input.checked = false;
        }
    }

    function selectPrevTerm(termVal) {
        const input = document.getElementById(`prevTerm${termVal}`);
        input.disabled = false;
        input.checked = true;
        state.prevTerm = termVal;
    }

    function setNewTermDisabled(termVal, disabled) {
        const input = document.getElementById(`newTerm${termVal}`);
        input.disabled = disabled;
        if (disabled && input.checked) {
            input.checked = false;
        }
    }

    function selectNewTerm(termVal) {
        const input = document.getElementById(`newTerm${termVal}`);
        input.disabled = false;
        input.checked = true;
        state.newTerm = termVal;
    }

    function calculateOverLoan() {
        // Calculate current payoff of previous loan
        const prevRate = RATES[state.clientType][state.prevTerm];
        const prevTotalInterest = state.prevAmount * prevRate;
        const prevTotalAmount = state.prevAmount + prevTotalInterest;
        const prevMonthlyPayment = Math.round(prevTotalAmount / state.prevTerm);
        const prevDailyInterest = prevTotalInterest / 360;

        const prevDate = new Date(state.prevLoanDate);
        const currDate = new Date(state.currentDate);

        const diffTime = Math.abs(currDate - prevDate);
        const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate accrued interest, but cap it at total interest
        const calculatedInterest = prevDailyInterest * daysElapsed;
        const accruedInterest = Math.round(Math.min(calculatedInterest, prevTotalInterest));

        // Calculate payments made on previous loan (with 20-day rule)
        let paymentsMade = 0;
        let paymentDate = new Date(prevDate);

        while (true) {
            paymentDate.setMonth(paymentDate.getMonth() + 1);

            const daysSincePayment = Math.ceil((currDate - paymentDate) / (1000 * 60 * 60 * 24));

            if (daysSincePayment >= 20) {
                paymentsMade++;
            } else if (daysSincePayment >= -20 && daysSincePayment < 20) {
                if (state.hasCurrentMonthPayment) {
                    paymentsMade++;
                }
                break;
            } else {
                break;
            }
        }

        const totalPaid = paymentsMade * prevMonthlyPayment;
        const remainingBalance = state.prevAmount + accruedInterest - totalPaid;
        const currentPayoff = Math.max(0, Math.round(remainingBalance));

        // Calculate new loan on combined amount
        const combinedAmount = Math.round(currentPayoff + state.newAmount);
        const newRate = RATES[state.clientType][state.newTerm];
        const newInterest = Math.round(combinedAmount * newRate);
        const newTotal = Math.round(combinedAmount + newInterest);
        const monthlyPayment = Math.round(newTotal / state.newTerm);

        return {
            prevAmount: state.prevAmount,
            prevTerm: state.prevTerm,
            prevRate,
            daysElapsed,
            accruedInterest,
            paymentsMade,
            totalPaid,
            currentPayoff,
            newAmount: state.newAmount,
            combinedAmount,
            newTerm: state.newTerm,
            newRate,
            newInterest,
            newTotal,
            monthlyPayment
        };
    }

    function renderResults() {
        resultsList.innerHTML = '';
        resultsSection.classList.remove('hidden');

        const data = calculateOverLoan();
        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="result-row">
                <span class="result-badge">Liquidación Actual</span>
            </div>
            <div class="result-row">
                <span>Préstamo Anterior:</span>
                <span>$${data.prevAmount.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Días Transcurridos:</span>
                <span>${data.daysElapsed} días</span>
            </div>
            <div class="result-row">
                <span>Interés Acumulado:</span>
                <span>$${data.accruedInterest.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Pagos Realizados:</span>
                <span>${data.paymentsMade} de ${data.prevTerm} ($${data.totalPaid.toLocaleString()} MXN)</span>
            </div>
            <div class="result-row">
                <span>Total a Liquidar Hoy:</span>
                <span>$${data.currentPayoff.toLocaleString()}</span>
            </div>
            <div class="result-divider"></div>
            <div class="result-row">
                <span class="result-badge">Nuevo Préstamo (${data.newTerm} Meses)</span>
                <span>Tasa: ${(data.newRate * 100).toFixed(1)}%</span>
            </div>
            <div class="result-row">
                <span>Monto Nuevo:</span>
                <span>$${data.newAmount.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Monto Combinado:</span>
                <span>$${data.combinedAmount.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Interés:</span>
                <span>$${data.newInterest.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span>Mensualidad:</span>
                <span>$${data.monthlyPayment.toLocaleString()}</span>
            </div>
            <div class="result-row total">
                <span>Total a Pagar:</span>
                <span>$${data.newTotal.toLocaleString()}</span>
            </div>
        `;
        resultsList.appendChild(card);

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function clearResults() {
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';
    }
}
