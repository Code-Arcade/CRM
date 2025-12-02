// Global variables
let allInquiries = [];
let filteredInquiries = [];
let currentPage = 1;
const itemsPerPage = 20;

// DOM Elements
const elements = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    searchInput: document.getElementById('searchInput'),
    statusFilter: document.getElementById('statusFilter'),
    sectorFilter: document.getElementById('sectorFilter'),
    typeFilter: document.getElementById('typeFilter'),
    favourFilter: document.getElementById('favourFilter'),
    resetFilters: document.getElementById('resetFilters'),
    tableBody: document.getElementById('tableBody'),
    pagination: document.getElementById('pagination'),
    recordCount: document.getElementById('recordCount'),
    totalInquiries: document.getElementById('totalInquiries'),
    awardedCount: document.getElementById('awardedCount'),
    estimationCount: document.getElementById('estimationCount'),
    droppedCount: document.getElementById('droppedCount'),
    refreshBtn: document.getElementById('refreshBtn'),
    exportBtn: document.getElementById('exportBtn'),
    detailModal: document.getElementById('detailModal'),
    modalBody: document.getElementById('modalBody'),
    closeModal: document.getElementById('closeModal')
};

// Initialize the application
async function init() {
    showLoading(true);
    
    try {
        await loadData();
        setupEventListeners();
        updateStats();
        applyFilters();
        
        // Add welcome animation
        setTimeout(() => {
            showLoading(false);
        }, 500);
    } catch (error) {
        console.error('Error initializing application:', error);
        showLoading(false);
        alert('Error loading data. Please check if iipl_data.json exists.');
    }
}

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('iipl_data.json');
        const data = await response.json();
        allInquiries = data.inquiries || [];
        filteredInquiries = [...allInquiries];
        console.log(`Loaded ${allInquiries.length} inquiries`);
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    elements.searchInput.addEventListener('input', debounce(() => {
        currentPage = 1;
        applyFilters();
    }, 300));
    
    // Filter selects
    [elements.statusFilter, elements.sectorFilter, elements.typeFilter, elements.favourFilter].forEach(filter => {
        filter.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
    });
    
    // Reset filters button
    elements.resetFilters.addEventListener('click', resetFilters);
    
    // Refresh button
    elements.refreshBtn.addEventListener('click', async () => {
        showLoading(true);
        await loadData();
        resetFilters();
        updateStats();
        applyFilters();
        showLoading(false);
    });
    
    // Export button
    elements.exportBtn.addEventListener('click', exportToCSV);
    
    // Modal close
    elements.closeModal.addEventListener('click', () => {
        elements.detailModal.classList.remove('active');
    });
    
    // Close modal on outside click
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) {
            elements.detailModal.classList.remove('active');
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.detailModal.classList.contains('active')) {
            elements.detailModal.classList.remove('active');
        }
    });
}

// Apply filters and search
function applyFilters() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    const statusFilter = elements.statusFilter.value;
    const sectorFilter = elements.sectorFilter.value;
    const typeFilter = elements.typeFilter.value;
    const favourFilter = elements.favourFilter.value;
    
    filteredInquiries = allInquiries.filter(inquiry => {
        // Search filter
        if (searchTerm) {
            const searchableText = [
                inquiry['INQUIRY ID'],
                inquiry['CLIENT DETAILS'],
                inquiry['ARCHITECT FIRM NAME'],
                inquiry['SECTOR'],
                inquiry['STATUS'],
                inquiry['TYPE'],
                inquiry['UPDATES']
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        // Status filter
        if (statusFilter && inquiry['STATUS'] !== statusFilter) {
            return false;
        }
        
        // Sector filter
        if (sectorFilter && inquiry['SECTOR'] !== sectorFilter) {
            return false;
        }
        
        // Type filter
        if (typeFilter && inquiry['TYPE'] !== typeFilter) {
            return false;
        }
        
        // Favour/Priority filter
        if (favourFilter && inquiry['FAVOUR'] !== favourFilter) {
            return false;
        }
        
        return true;
    });
    
    updateRecordCount();
    renderTable();
    renderPagination();
}

// Reset all filters
function resetFilters() {
    elements.searchInput.value = '';
    elements.statusFilter.value = '';
    elements.sectorFilter.value = '';
    elements.typeFilter.value = '';
    elements.favourFilter.value = '';
    currentPage = 1;
    applyFilters();
}

// Update statistics
function updateStats() {
    const total = allInquiries.length;
    const awarded = allInquiries.filter(i => i['STATUS'] === 'Awarded').length;
    const estimation = allInquiries.filter(i => i['STATUS'] === 'Estimation Sent').length;
    const dropped = allInquiries.filter(i => i['STATUS'] === 'Dropped').length;
    
    animateNumber(elements.totalInquiries, total);
    animateNumber(elements.awardedCount, awarded);
    animateNumber(elements.estimationCount, estimation);
    animateNumber(elements.droppedCount, dropped);
}

// Animate number counting
function animateNumber(element, target) {
    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Update record count
function updateRecordCount() {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredInquiries.length);
    const total = filteredInquiries.length;
    
    elements.recordCount.textContent = total > 0 
        ? `Showing ${start}-${end} of ${total} records`
        : 'No records found';
}

// Render table
function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredInquiries.slice(start, end);
    
    if (pageData.length === 0) {
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg style="width: 64px; height: 64px; margin-bottom: 1rem; opacity: 0.5;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                    </svg>
                    <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No records found</div>
                    <div style="font-size: 0.9375rem;">Try adjusting your search or filters</div>
                </td>
            </tr>
        `;
        return;
    }
    
    elements.tableBody.innerHTML = pageData.map(inquiry => {
        const status = inquiry['STATUS'] || 'N/A';
        const statusClass = getStatusClass(status);
        const priority = inquiry['FAVOUR'] || 'N/A';
        const priorityClass = priority === 'HIGH' ? 'priority-high' : 'priority-neutral';
        
        return `
            <tr>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${inquiry['INQUIRY ID'] || 'N/A'}">${inquiry['INQUIRY ID'] || 'N/A'}</td>
                <td><span class="priority-badge ${priorityClass}">${priority}</span></td>
                <td>${inquiry['TYPE'] || 'N/A'}</td>
                <td>${inquiry['SECTOR'] || 'N/A'}</td>
                <td>${formatDate(inquiry['INQUIRY DATE'])}</td>
                <td>${formatCurrency(inquiry['ESTIMATION AMOUNT'])}</td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${inquiry['CLIENT DETAILS'] || 'N/A'}">${inquiry['CLIENT DETAILS'] || 'N/A'}</td>
                <td>
                    <button class="btn-view" onclick="showDetails(${start + pageData.indexOf(inquiry)})">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get status class
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('awarded')) return 'status-awarded';
    if (statusLower.includes('dropped')) return 'status-dropped';
    if (statusLower.includes('estimation')) return 'status-estimation';
    if (statusLower.includes('lead')) return 'status-lead';
    return 'status-estimation';
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
    
    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
        </button>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span style="padding: 0 0.5rem; color: var(--text-muted);">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span style="padding: 0 0.5rem; color: var(--text-muted);">...</span>`;
        }
        paginationHTML += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
            </svg>
        </button>
    `;
    
    elements.pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    renderPagination();
    updateRecordCount();
    
    // Scroll to top of table
    document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
}

// Show inquiry details
function showDetails(index) {
    const inquiry = filteredInquiries[index];
    if (!inquiry) return;
    
    const detailsHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <label>Inquiry ID</label>
                <div class="value">${inquiry['INQUIRY ID'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Status</label>
                <div class="value"><span class="status-badge ${getStatusClass(inquiry['STATUS'] || 'N/A')}">${inquiry['STATUS'] || 'N/A'}</span></div>
            </div>
            
            <div class="detail-item">
                <label>Priority</label>
                <div class="value"><span class="priority-badge ${inquiry['FAVOUR'] === 'HIGH' ? 'priority-high' : 'priority-neutral'}">${inquiry['FAVOUR'] || 'N/A'}</span></div>
            </div>
            
            <div class="detail-item">
                <label>Type</label>
                <div class="value">${inquiry['TYPE'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Sector</label>
                <div class="value">${inquiry['SECTOR'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Inquiry Date</label>
                <div class="value">${formatDate(inquiry['INQUIRY DATE'])}</div>
            </div>
            
            <div class="detail-item">
                <label>Estimation Amount</label>
                <div class="value" style="font-size: 1.25rem; font-weight: 700; color: var(--accent-green);">${formatCurrency(inquiry['ESTIMATION AMOUNT'])}</div>
            </div>
            
            <div class="detail-item">
                <label>Estimation Date</label>
                <div class="value">${formatDate(inquiry['ESTIMATION DATE'])}</div>
            </div>
            
            <div class="detail-item">
                <label>Awarded Date</label>
                <div class="value">${formatDate(inquiry['AWARDED DATE'])}</div>
            </div>
            
            <div class="detail-item">
                <label>Prepared By</label>
                <div class="value">${inquiry['EST PREP BY'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Architect Firm</label>
                <div class="value">${inquiry['ARCHITECT FIRM NAME'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Architect Details</label>
                <div class="value">${inquiry['ARCHITECT DETAILS'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Client Details</label>
                <div class="value">${inquiry['CLIENT DETAILS'] || 'N/A'}</div>
            </div>
            
            <div class="detail-item">
                <label>Reference</label>
                <div class="value">${inquiry[' REF.'] || 'N/A'}</div>
            </div>
            
            ${inquiry['UPDATES'] ? `
            <div class="detail-item" style="grid-column: 1 / -1;">
                <label>Updates</label>
                <div class="value" style="white-space: pre-wrap;">${inquiry['UPDATES']}</div>
            </div>
            ` : ''}
            
            <div class="detail-item" style="grid-column: 1 / -1;">
                <label>Revision History</label>
                <div class="value">
                    ${generateRevisionHistory(inquiry)}
                </div>
            </div>
        </div>
    `;
    
    elements.modalBody.innerHTML = detailsHTML;
    elements.detailModal.classList.add('active');
}

// Generate revision history
function generateRevisionHistory(inquiry) {
    const revisions = [];
    
    for (let i = 0; i <= 16; i++) {
        const amount = inquiry[`R${i}`];
        const date = inquiry[`R${i} DATE`];
        
        if (amount || date) {
            revisions.push({
                revision: `R${i}`,
                amount: amount,
                date: date
            });
        }
    }
    
    if (revisions.length === 0) {
        return '<span style="color: var(--text-muted);">No revisions recorded</span>';
    }
    
    return `
        <div style="display: grid; gap: 0.75rem; margin-top: 0.5rem;">
            ${revisions.map(rev => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    <span style="font-weight: 600; color: var(--accent-purple);">${rev.revision}</span>
                    <span>${formatCurrency(rev.amount)}</span>
                    <span style="color: var(--text-secondary);">${formatDate(rev.date)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A' || dateString === 'NaN') return 'N/A';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'N/A';
    }
}

// Format currency
function formatCurrency(amount) {
    if (!amount || amount === 'N/A' || isNaN(amount)) return 'N/A';
    
    const num = parseFloat(amount);
    if (isNaN(num)) return 'N/A';
    
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Export to CSV
function exportToCSV() {
    const headers = [
        'Enquiry Status', 'INQUIRY ID', 'FAVOUR', 'STATUS', 'TYPE', 'SECTOR',
        'INQUIRY DATE', 'ESTIMATION AMOUNT', 'ESTIMATION DATE', 'AWARDED DATE',
        'EST PREP BY', 'ARCHITECT FIRM NAME', 'ARCHITECT DETAILS', 'CLIENT DETAILS',
        'UPDATES'
    ];
    
    let csv = headers.join(',') + '\n';
    
    filteredInquiries.forEach(inquiry => {
        const row = headers.map(header => {
            let value = inquiry[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            return value;
        });
        csv += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `IIPL_CRM_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show/hide loading overlay
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

// Make showDetails global
window.showDetails = showDetails;
window.changePage = changePage;
