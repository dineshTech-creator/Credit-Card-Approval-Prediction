document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const predictionForm = document.getElementById('predictionForm');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const resultContainer = document.getElementById('resultContainer');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const historyTableBody = document.getElementById('historyTableBody');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    // Loaded chart instances
    let chartObjects = {};

    // ====================================================
    // 1. Tab Switching Logic
    // ====================================================
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');
            
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Trigger chart rendering when visiting charts tab
            if (targetTab === 'charts-tab') {
                loadMetricsAndRenderCharts();
            } else if (targetTab === 'metrics-tab') {
                loadMetricsAndRenderTable();
            } else if (targetTab === 'history-tab') {
                renderHistoryTable();
            }
        });
    });

    // ====================================================
    // 2. Light / Dark Theme Toggle
    // ====================================================
    let currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon(currentTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                </svg>
            `;
        } else {
            themeIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
        }
    }

    // ====================================================
    // 3. Form Handling & Prediction Fetch
    // ====================================================
    predictionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show Loading Screen
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
            <div class="spinner-wrapper">
                <div class="spinner"></div>
                <p style="font-weight: 600; font-size: 0.95rem; color: var(--text-secondary);">Grader is evaluating risk criteria...</p>
            </div>
        `;

        // Gather features from DOM
        const payload = {
            gender: document.getElementById('gender').value,
            age: parseInt(document.getElementById('age').value),
            income: parseFloat(document.getElementById('income').value),
            education: document.getElementById('education').value,
            family_status: document.getElementById('family_status').value,
            children: parseInt(document.getElementById('children').value),
            housing_type: document.getElementById('housing_type').value,
            occupation: document.getElementById('occupation').value,
            years_employed: parseFloat(document.getElementById('years_employed').value),
            family_size: parseInt(document.getElementById('family_size').value),
            own_car: document.getElementById('own_car').value,
            own_realty: document.getElementById('own_realty').value,
            income_type: document.getElementById('income_type').value,
            unemployed: document.getElementById('years_employed').value == "0" ? 1 : 0
        };

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (response.ok) {
                renderResult(result, payload);
                saveToHistory(result, payload);
            } else {
                renderError(result.error || 'Server error occurred during prediction.');
            }
        } catch (err) {
            renderError('Failed to connect to the backend server. Make sure app.py is running.');
            console.error(err);
        }
    });

    resetFormBtn.addEventListener('click', () => {
        predictionForm.reset();
        resultContainer.style.display = 'none';
        resultContainer.innerHTML = '';
    });

    function renderResult(result, payload) {
        const borderClass = result.approved ? 'success-border' : 'danger-border';
        const badgeClass = result.approved ? 'success-badge' : 'danger-badge';
        const riskClass = `risk-${result.risk_level.toLowerCase()}`;
        const titleText = result.approved ? 'APPROVED' : 'REJECTED';
        
        const textMessage = result.approved 
            ? 'Based on credit records, you satisfy the bank\'s criteria for card approval.' 
            : 'Apologies, your credit profile shows higher delinquency risk and cannot be approved.';

        const strokeColor = result.approved ? 'url(#gradientApproved)' : 'url(#gradientRejected)';

        resultContainer.innerHTML = `
            <div class="result-card ${borderClass}">
                <div class="status-badge ${badgeClass}">${titleText}</div>
                <p style="margin-bottom: 25px; font-weight: 600; font-size: 0.96rem; line-height: 1.5; color: var(--text-primary);">${textMessage}</p>
                
                <div style="font-size: 0.76rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                    Approval Confidence
                </div>
                
                <!-- Circular animated SVG Progress Gauge -->
                <div class="confidence-ring-container">
                    <svg class="progress-ring" width="120" height="120">
                        <circle class="progress-ring__circle-bg" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="transparent" r="50" cx="60" cy="60"/>
                        <circle class="progress-ring__circle" stroke="${strokeColor}" stroke-width="8" fill="transparent" r="50" cx="60" cy="60" stroke-linecap="round"/>
                        <defs>
                            <linearGradient id="gradientApproved" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#10b981" />
                                <stop offset="100%" stop-color="#059669" />
                            </linearGradient>
                            <linearGradient id="gradientRejected" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#f43f5e" />
                                <stop offset="100%" stop-color="#e11d48" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div class="confidence-ring-text" id="confidenceRingText">0%</div>
                </div>
                
                <div>
                    <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 700;">RISK EVALUATION:</span>
                    <span class="risk-box ${riskClass}">${result.risk_level} Risk</span>
                </div>

                <div style="margin-top: 25px; width: 100%;">
                    <button class="btn btn-primary" id="downloadPdfBtn" style="margin: 0 auto; width: 100%; max-width: 260px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Download PDF Report
                    </button>
                </div>
            </div>
        `;

        // Trigger circular SVG animation
        const progressCircle = resultContainer.querySelector('.progress-ring__circle');
        const confidenceTextEl = document.getElementById('confidenceRingText');
        const confidenceValue = parseFloat(result.confidence);
        
        // Circumference C = 2 * PI * r = 2 * 3.14159 * 50 = 314.159
        const circumference = 314.159;
        const offset = circumference - (confidenceValue / 100) * circumference;
        
        setTimeout(() => {
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = offset;
            }
            
            // Text count up animation
            let currentVal = 0;
            const interval = setInterval(() => {
                if (currentVal >= confidenceValue) {
                    confidenceTextEl.textContent = confidenceValue + '%';
                    clearInterval(interval);
                } else {
                    currentVal += 1;
                    confidenceTextEl.textContent = currentVal + '%';
                }
            }, 8);
        }, 150);

        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
            generatePrintReport(result, payload);
        });
    }

    function renderError(message) {
        resultContainer.innerHTML = `
            <div class="result-card danger-border" style="background: rgba(244, 63, 94, 0.08);">
                <div class="status-badge danger-badge">ERROR</div>
                <p style="color: var(--color-danger); font-weight: 650; font-size: 0.95rem;">${message}</p>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Verify input values and re-evaluate.</p>
            </div>
        `;
    }

    // ====================================================
    // 4. Prediction History Manager (LocalStorage)
    // ====================================================
    function saveToHistory(result, payload) {
        let history = JSON.parse(localStorage.getItem('prediction_history')) || [];
        const entry = {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toLocaleString(),
            payload: payload,
            result: result
        };
        history.unshift(entry); // add to top
        localStorage.setItem('prediction_history', JSON.stringify(history));
    }

    function renderHistoryTable() {
        let history = JSON.parse(localStorage.getItem('prediction_history')) || [];
        
        if (history.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 35px; font-weight: 600;">
                        No prediction history available yet. Complete a calculation first.
                    </td>
                </tr>
            `;
            return;
        }

        historyTableBody.innerHTML = '';
        history.forEach((entry, idx) => {
            const riskClass = `risk-${entry.result.risk_level.toLowerCase()}`;
            const statusClass = entry.result.approved ? 'color: var(--color-success); font-weight: 700;' : 'color: var(--color-danger); font-weight: 700;';
            const statusText = entry.result.approved ? 'APPROVED' : 'REJECTED';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.id}</td>
                <td>${entry.date}</td>
                <td>$${entry.payload.income.toLocaleString()}</td>
                <td style="${statusClass}">${statusText}</td>
                <td>${entry.result.confidence}%</td>
                <td>
                    <button class="btn btn-secondary pdf-download-btn" data-index="${idx}" style="padding: 6px 12px; font-size: 0.8rem; margin: 0;">
                        Download Report
                    </button>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });

        // Add event listeners to history PDF buttons
        const downloadButtons = historyTableBody.querySelectorAll('.pdf-download-btn');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                const record = history[index];
                generatePrintReport(record.result, record.payload, record.id, record.date);
            });
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your prediction history?')) {
                localStorage.removeItem('prediction_history');
                renderHistoryTable();
            }
        });
    }

    // ====================================================
    // 5. Dynamic PDF Generation via Iframe Printing (CrediShield AI)
    // ====================================================
    function generatePrintReport(result, payload, customId = null, customDate = null) {
        const reportId = customId || 'TXN-' + Math.floor(100000 + Math.random() * 900000);
        const reportDate = customDate || new Date().toLocaleString();
        
        const decisionText = result.approved ? 'ELIGIBLE / APPROVED' : 'INELIGIBLE / REJECTED';
        const decisionColor = result.approved ? '#10b981' : '#f43f5e';
        const descriptionText = result.approved
            ? 'Congratulations! Based on our automated credit grading system, your profile indicates safe repayment behavior, satisfying our card underwriting criteria.'
            : 'We regret to inform you that your application cannot be approved at this time. Our machine learning system flags credit delinquency patterns inside similar financial profiles.';

        // Map code flags to readable values
        const genderText = payload.gender === 'F' ? 'Female' : 'Male';
        const carText = payload.own_car === 'Y' ? 'Yes' : 'No';
        const propertyText = payload.own_realty === 'Y' ? 'Yes' : 'No';

        // Prepare print styles and layout
        const printContent = `
            <html>
            <head>
                <title>Credit Eligibility Report</title>
                <style>
                    body {
                        font-family: 'Inter', -apple-system, sans-serif;
                        color: #0f172a;
                        padding: 40px;
                        line-height: 1.55;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 2px solid #f1f5f9;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo-text {
                        font-size: 22px;
                        font-weight: 800;
                        color: #4f46e5;
                        letter-spacing: -0.5px;
                    }
                    .txn-details {
                        text-align: right;
                        font-size: 13px;
                        color: #64748b;
                    }
                    .title {
                        font-size: 24px;
                        font-weight: 800;
                        margin-bottom: 12px;
                        letter-spacing: -0.5px;
                    }
                    .decision-box {
                        border: 2px solid ${decisionColor};
                        background: ${result.approved ? 'rgba(16, 185, 129, 0.03)' : 'rgba(244, 63, 94, 0.03)'};
                        padding: 24px;
                        border-radius: 12px;
                        margin-bottom: 30px;
                    }
                    .decision-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: ${decisionColor};
                        margin-bottom: 8px;
                    }
                    .section-title {
                        font-size: 14px;
                        font-weight: 700;
                        color: #4f46e5;
                        text-transform: uppercase;
                        margin-top: 30px;
                        margin-bottom: 15px;
                        border-bottom: 1px solid #f1f5f9;
                        padding-bottom: 6px;
                        letter-spacing: 0.5px;
                    }
                    .grid-details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px 24px;
                        font-size: 14px;
                    }
                    .grid-item {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 1px solid #f8fafc;
                        padding-bottom: 5px;
                    }
                    .grid-item span:first-child {
                        color: #64748b;
                        font-weight: 500;
                    }
                    .grid-item span:last-child {
                        font-weight: 600;
                        color: #0f172a;
                    }
                    .footer {
                        text-align: center;
                        font-size: 11px;
                        color: #94a3b8;
                        margin-top: 70px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo-text">CREDISHIELD AI</div>
                        <div style="font-size: 12px; color: #64748b; font-weight: 600;">Credit Risk Assessment & Underwriting</div>
                    </div>
                    <div class="txn-details">
                        <div>Transaction ID: <strong>${reportId}</strong></div>
                        <div>Date: ${reportDate}</div>
                    </div>
                </div>
                
                <div class="title">Credit Assessment Letter</div>
                <p style="font-size: 14px; color: #475569;">This letter certifies the risk classification and scoring outcomes calculated by the automated CrediShield AI underwriting system.</p>
                
                <div class="decision-box">
                    <div class="decision-title">DECISION: ${decisionText}</div>
                    <p style="margin: 0; font-size: 14.5px; color: #334155; line-height: 1.6;">${descriptionText}</p>
                    <div style="margin-top: 15px; font-size: 14px; font-weight: 600;">
                        <span>System Confidence: <strong>${result.confidence}%</strong></span> | 
                        <span>Risk Grading: <strong>${result.risk_level} Risk</strong></span>
                    </div>
                </div>
                
                <div class="section-title">Applicant profile metadata</div>
                <div class="grid-details">
                    <div class="grid-item"><span>Gender</span><span>${genderText}</span></div>
                    <div class="grid-item"><span>Age</span><span>${payload.age} Years</span></div>
                    <div class="grid-item"><span>Annual Income</span><span>$${payload.income.toLocaleString()}</span></div>
                    <div class="grid-item"><span>Income Source</span><span>${payload.income_type}</span></div>
                    <div class="grid-item"><span>Education Achieved</span><span>${payload.education}</span></div>
                    <div class="grid-item"><span>Marital Status</span><span>${payload.family_status}</span></div>
                    <div class="grid-item"><span>Housing Structure</span><span>${payload.housing_type}</span></div>
                    <div class="grid-item"><span>Occupation Type</span><span>${payload.occupation}</span></div>
                    <div class="grid-item"><span>Years Employed</span><span>${payload.years_employed} Years</span></div>
                    <div class="grid-item"><span>Family Size</span><span>${payload.family_size}</span></div>
                    <div class="grid-item"><span>Number of Children</span><span>${payload.children}</span></div>
                    <div class="grid-item"><span>Car Owner</span><span>${carText}</span></div>
                    <div class="grid-item"><span>Property Owner</span><span>${propertyText}</span></div>
                </div>
                
                <div class="footer">
                    <p>This document is generated automatically by a predictive machine learning classifier. No physical signature is required.</p>
                    <p>&copy; 2026 CrediShield AI Services Group LLC. Confidential document.</p>
                </div>
            </body>
            </html>
        `;

        // Create iframe to call print dialogs
        let iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        let doc = iframe.contentWindow.document;
        doc.open();
        doc.write(printContent);
        doc.close();

        iframe.contentWindow.focus();
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    }

    // ====================================================
    // 6. Metrics and Charts Fetching / Rendering
    // ====================================================
    let metricsLoaded = false;
    let metricsCache = null;

    async function fetchMetricsData() {
        if (metricsLoaded && metricsCache) {
            return metricsCache;
        }
        
        try {
            const res = await fetch('/metrics');
            if (!res.ok) throw new Error('Failed to retrieve metrics.');
            const data = await res.json();
            metricsCache = data;
            metricsLoaded = true;
            return data;
        } catch (err) {
            console.error('Failed to load metrics data:', err);
            return null;
        }
    }

    async function loadMetricsAndRenderTable() {
        const data = await fetchMetricsData();
        if (!data) return;

        const tableBody = document.getElementById('metricsTableBody');
        const bestModelNameEl = document.getElementById('bestModelName');
        const bestModelAccEl = document.getElementById('bestModelAcc');
        const bestModelF1El = document.getElementById('bestModelF1');

        bestModelNameEl.textContent = data.metrics.best_model.name;
        bestModelAccEl.textContent = (data.metrics.best_model.accuracy * 100).toFixed(2) + '%';
        bestModelF1El.textContent = (data.metrics.best_model.f1_score * 100).toFixed(2) + '%';

        tableBody.innerHTML = '';
        const comparison = data.metrics.comparison;
        for (const [modelName, scores] of Object.entries(comparison)) {
            const isWinner = modelName === data.metrics.best_model.name;
            const rowStyle = isWinner ? 'background: rgba(99, 102, 241, 0.08); font-weight: 700;' : '';
            const badge = isWinner ? '<span class="risk-box risk-low" style="font-size:0.65rem; padding: 2px 6px; margin-left: 8px;">Winner</span>' : '';
            
            const tr = document.createElement('tr');
            tr.style = rowStyle;
            
            // Handle F1 Score keys flexibility
            const f1_score_value = scores['F1 Score'] !== undefined ? scores['F1 Score'] : scores['F1_Score'];

            tr.innerHTML = `
                <td>${modelName} ${badge}</td>
                <td>${(scores.Accuracy * 100).toFixed(2)}%</td>
                <td>${(scores.Precision * 100).toFixed(2)}%</td>
                <td>${(scores.Recall * 100).toFixed(2)}%</td>
                <td>${(f1_score_value * 100).toFixed(2)}%</td>
                <td>${(scores['ROC AUC'] * 100).toFixed(2)}%</td>
            `;
            tableBody.appendChild(tr);
        }
    }

    async function loadMetricsAndRenderCharts() {
        const data = await fetchMetricsData();
        if (!data) return;

        renderFeatureImportanceChart(data.metrics.feature_importances);
        renderApprovalRatioChart(data.stats.class_counts);
        renderIncomeDistributionChart(data.stats.income_cat_counts);
        renderAgeGroupDistributionChart(data.stats.age_cat_counts);
    }

    function destroyChart(name) {
        if (chartObjects[name]) {
            chartObjects[name].destroy();
        }
    }

    function renderFeatureImportanceChart(importances) {
        destroyChart('importance');
        const ctx = document.getElementById('featureImportanceChart').getContext('2d');
        
        const keys = Object.keys(importances).slice(0, 8);
        const values = Object.values(importances).slice(0, 8);
        
        chartObjects['importance'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: keys,
                datasets: [{
                    label: 'Relative Importance Score',
                    data: values,
                    backgroundColor: 'rgba(99, 102, 241, 0.75)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', weight: 600 } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }
                }
            }
        });
    }

    function renderApprovalRatioChart(counts) {
        destroyChart('approval');
        const ctx = document.getElementById('approvalRatioChart').getContext('2d');
        
        const approvedCount = counts['1'] || 0;
        const rejectedCount = counts['0'] || 0;

        chartObjects['approval'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Approved (Safe)', 'Rejected (Risky)'],
                datasets: [{
                    data: [approvedCount, rejectedCount],
                    backgroundColor: ['rgba(16, 185, 129, 0.75)', 'rgba(244, 63, 94, 0.75)'],
                    borderColor: ['rgba(16, 185, 129, 1)', 'rgba(244, 63, 94, 1)'],
                    borderWidth: 1.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', weight: 600 } }
                    }
                }
            }
        });
    }

    function renderIncomeDistributionChart(counts) {
        destroyChart('income');
        const ctx = document.getElementById('incomeDistChart').getContext('2d');
        
        const labels = ['Low (<$100k)', 'Medium ($100k-$200k)', 'High (>$200k)'];
        const values = [counts['Low'] || 0, counts['Medium'] || 0, counts['High'] || 0];

        chartObjects['income'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Applicant Count',
                    data: values,
                    backgroundColor: 'rgba(251, 191, 36, 0.75)',
                    borderColor: 'rgba(251, 191, 36, 1)',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', weight: 600 } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }
                }
            }
        });
    }

    function renderAgeGroupDistributionChart(counts) {
        destroyChart('age');
        const ctx = document.getElementById('ageDistChart').getContext('2d');
        
        const labels = ['Young (<30)', 'Middle-Aged (30-50)', 'Senior (50+)'];
        const values = [counts['Young'] || 0, counts['Middle-Aged'] || 0, counts['Senior'] || 0];

        chartObjects['age'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(6, 182, 212, 0.75)',
                        'rgba(99, 102, 241, 0.75)',
                        'rgba(168, 85, 247, 0.75)'
                    ],
                    borderColor: [
                        'rgba(6, 182, 212, 1)',
                        'rgba(99, 102, 241, 1)',
                        'rgba(168, 85, 247, 1)'
                    ],
                    borderWidth: 1.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', weight: 600 } }
                    }
                }
            }
        });
    }
});
