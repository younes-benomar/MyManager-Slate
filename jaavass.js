// ==========================================
// === 0. SECURITY & SETUP 🔒 ===
// ==========================================
const currentUser = localStorage.getItem('currentUser') || 'Invite';
const userRole = localStorage.getItem('userRole') || 'visiteur';

if (localStorage.getItem('isLoggedIn') !== 'true') window.location.href = 'login_page.html';

function getAvatar(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=475E67&color=fff&bold=true&length=2&size=128`;
}

document.addEventListener('DOMContentLoaded', () => {
    let profileData = {
        name: currentUser, 
        role: userRole === 'admin' ? 'Administrateur' : 'Client',
        avatar: getAvatar(currentUser) 
    };

    if (userRole === 'admin') {
        const switchText = document.getElementById('switchText');
        if(switchText) switchText.innerText = "Changer Compte";
    } else {
        const switchBtn = document.querySelector('button[onclick="switchAccount()"]');
        if(switchBtn) switchBtn.style.display = 'none';
    }

    document.getElementById('userNameDisplay').innerText = profileData.name;
    document.getElementById('userRoleDisplay').innerText = profileData.role;
    document.getElementById('userAvatar').src = profileData.avatar;

    checkPermissions();
    fetchUsers();
    fetchProducts();
});

// ✅ FIX: Client sees Orders

function checkPermissions() {
    if (userRole === 'visiteur') {
        ['nav-dashboard', 'nav-users', 'nav-clients', 'addProductBtn', 'addUserBtn'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
        document.getElementById('cartBtn').classList.remove('hidden');
        biyyen('products');
    } else {
        biyyen('dashboard');
    }
}

// ... (Toggle, Logout, Switch) ...
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('hidden'); }
function logout() { localStorage.removeItem('isLoggedIn'); window.location.href = 'login_page.html'; }
function switchAccount() {
    if (userRole !== 'admin') return;
    const currentNamePart = currentUser.toLowerCase();
    let targetUser = currentNamePart.includes('younes') ? 'mustapha' : 'younes';
    document.body.style.opacity = '0.5';
    setTimeout(() => { localStorage.setItem('currentUser', targetUser); location.reload(); }, 500);
}
document.addEventListener('click', function(event) {
    const menu = document.getElementById('profileMenu');
    const btn = document.querySelector('button[onclick="toggleProfileMenu()"]');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(event.target) && !btn.contains(event.target)) menu.classList.add('hidden');
});

// ==========================================
// === 1. DATA ===
// ==========================================
let usersList = [], productsList = [], cart = [];
const savedOrders = localStorage.getItem('myOrders'); let ordersList = savedOrders ? JSON.parse(savedOrders) : [];
const savedClients = localStorage.getItem('myClients'); let clientsList = savedClients ? JSON.parse(savedClients) : [];
const savedReviews = localStorage.getItem('myReviews'); let reviewsList = savedReviews ? JSON.parse(savedReviews) : [{id: 1, user: "Anonyme", role: "Client", text: "Service impeccable!", stars: 5}];
let myChart = null; let currentChartType = 'bar';

// ==========================================
// === 2. NAVIGATION ===
// ==========================================
const biyyen = (id) => {
    if (userRole === 'visiteur' && ['dashboard', 'users', 'clients'].includes(id)) return;
    ['dashboard', 'users', 'products', 'clients', 'orders', 'reviews'].forEach(section => {
        document.getElementById(section + '-section').classList.add('hidden');//...

        const btn = document.getElementById('nav-' + section);
        if(btn) { btn.classList.remove('bg-surfaceDark', 'text-white'); btn.classList.add('text-textSoft'); }
    });
    document.getElementById(id + '-section').classList.remove('hidden');
    const activeBtn = document.getElementById('nav-' + id);
    if(activeBtn) { activeBtn.classList.remove('text-textSoft'); activeBtn.classList.add('bg-surfaceDark', 'text-white'); }
    document.getElementById('pageTitle').innerText = id.charAt(0).toUpperCase() + id.slice(1);
    
    if(id === 'dashboard') updateDashboard();
    if(id === 'products') filterAndSortProducts(); 
    if(id === 'clients') renderClients();
    if(id === 'orders') renderOrders(); 
    if(id === 'reviews') renderReviews();
};

// ==========================================
// === 3. USERS LOGIC (EDIT & ADD) ===
// ==========================================
async function fetchUsers() {
    try {
        if(usersList.length === 0) {
            const res = await fetch("https://jsonplaceholder.typicode.com/users");
            usersList = await res.json();
        }
        afficherUsers();
        if(userRole === 'admin') updateDashboard();
    } catch(e) { console.error(e); }
}

function filterUsers() {
    const search = document.getElementById('searchUserInput').value.toLowerCase();
    const filtered = usersList.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
    renderUsersTable(filtered);
}

function saveUser() {
    const id = document.getElementById('editUserId').value;
    const name = document.getElementById('inputName').value;
    const email = document.getElementById('inputEmail').value;
    const city = document.getElementById('inputCity').value;

    if(!name) return;

    if (id) {
        // UPDATE
        const index = usersList.findIndex(u => u.id == id);
        if (index !== -1) {
            usersList[index] = { ...usersList[index], name, email, address: {city} };
        }
    } else {
        // CREATE (Incremental ID)
        const newId = usersList.length > 0 ? Math.max(...usersList.map(u => u.id)) + 1 : 1;
        usersList.push({ id: newId, name, email, address: {city} });
    }
    afficherUsers(); closeModal();
}

function openUserModal(mode, userId = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const btn = document.getElementById('userModalBtn');
    
    modal.classList.remove('hidden'); modal.classList.add('flex');

    if (mode === 'edit') {
        const user = usersList.find(u => u.id === userId);
        document.getElementById('editUserId').value = user.id;
        document.getElementById('inputName').value = user.name;
        document.getElementById('inputEmail').value = user.email;
        document.getElementById('inputCity').value = user.address?.city;
        title.innerText = "Modifier Utilisateur";
        btn.innerText = "Sauvegarder";
    } else {
        document.getElementById('editUserId').value = '';
        document.getElementById('inputName').value = '';
        document.getElementById('inputEmail').value = '';
        document.getElementById('inputCity').value = '';
        title.innerText = "Nouvel Utilisateur";
        btn.innerText = "Créer";
    }
}

function afficherUsers() { renderUsersTable(usersList); }
function renderUsersTable(list) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = list.map(u => `
        <tr class="hover:bg-bgMain/30 border-b border-white/5">
            <td class="p-5 text-textSoft">#${u.id}</td>
            <td class="p-5 font-bold text-textMain">${u.name}</td>
            <td class="p-5 text-textSoft">${u.email}</td>
            <td class="p-5 text-textSoft">${u.address?.city}</td>
            <td class="p-5 text-center flex justify-center gap-2">
                ${userRole==='admin' ? `
                <button onclick="openUserModal('edit', ${u.id})" class="text-blue-300 hover:text-blue-400 p-2 rounded-xl hover:bg-blue-500/10"><i class="ph ph-pencil-simple"></i></button>
                <button onclick="deleteUser(${u.id})" class="text-red-300 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10"><i class="ph ph-trash"></i></button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}
function deleteUser(id) { if(userRole!=='admin') return; if(confirm("Supprimer?")) { usersList = usersList.filter(u => u.id !== id); afficherUsers(); updateDashboard(); } }

// ==========================================
// === 4. PRODUCTS LOGIC (EDIT & ADD) ===
// ==========================================
async function fetchProducts() {
    const stored = localStorage.getItem('myProducts');
    if (stored) productsList = JSON.parse(stored);
    else {
        productsList = [
            { id: 1, title: "RTX 4090", price: 4500, category: "PC", image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500", inStock: true },
            { id: 2, title: "PS5 Pro", price: 499, category: "Console", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500", inStock: true }
        ];
        localStorage.setItem('myProducts', JSON.stringify(productsList));
    }
    filterAndSortProducts(); 
    if(userRole === 'admin') updateDashboard();
}

function saveProduct() {
    const id = document.getElementById('editProdId').value;
    const t = document.getElementById('prodTitle').value;
    const p = document.getElementById('prodPrice').value;
    const cat = document.getElementById('prodCat').value;
    const img = document.getElementById('prodImg').value;

    if(!t) return;

    if(id) {
        // UPDATE
        const idx = productsList.findIndex(p => p.id == id);
        if(idx !== -1) {
            productsList[idx] = { ...productsList[idx], title: t, price: p, category: cat, image: img || productsList[idx].image };
        }
    } else {
        // ADD
        const newId = productsList.length > 0 ? Math.max(...productsList.map(p => p.id)) + 1 : 1;
        productsList.push({ id: newId, title: t, price: p, category: cat, image: img || "https://via.placeholder.com/150", inStock: true });
    }

    localStorage.setItem('myProducts', JSON.stringify(productsList)); 
    filterAndSortProducts(); 
    closeProductModal();
}

function openProductModal(mode, prodId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('prodModalTitle');
    const btn = document.getElementById('prodModalBtn');
    modal.classList.remove('hidden'); modal.classList.add('flex');

    if(mode === 'edit') {
        const p = productsList.find(x => x.id === prodId);
        document.getElementById('editProdId').value = p.id;
        document.getElementById('prodTitle').value = p.title;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodCat').value = p.category;
        document.getElementById('prodImg').value = p.image;
        title.innerText = "Modifier Produit";
        btn.innerText = "Sauvegarder";
    } else {
        document.getElementById('editProdId').value = '';
        document.getElementById('prodTitle').value = '';
        document.getElementById('prodPrice').value = '';
        document.getElementById('prodImg').value = '';
        title.innerText = "Ajouter Produit";
        btn.innerText = "Ajouter";
    }
}

function toggleStock(id) { const p = productsList.find(x => x.id === id); if(p) { p.inStock = !p.inStock; localStorage.setItem('myProducts', JSON.stringify(productsList)); filterAndSortProducts(); } }
function deleteProduct(id) { if(userRole !== 'admin') return; if(confirm("Supprimer?")) { productsList = productsList.filter(p => p.id !== id); localStorage.setItem('myProducts', JSON.stringify(productsList)); filterAndSortProducts(); updateDashboard(); } }

function filterAndSortProducts() {
    const searchText = document.getElementById('searchProductInput').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const sort = document.getElementById('filterSort').value;
    let filtered = productsList.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchText);
        const matchesCat = category === 'all' || p.category === category;
        return matchesSearch && matchesCat;
    });
    if (sort === 'price_asc') filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sort === 'price_desc') filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    renderProducts(filtered);
}

function renderProducts(list) {
    const grid = document.getElementById('products-grid'); if(!grid) return;
    if(list.length === 0) { grid.innerHTML = '<div class="col-span-4 text-center text-textSoft py-10">Aucun produit trouvé</div>'; return; }
    grid.innerHTML = list.map(p => {
        const stockStatus = p.inStock ? '' : '<span class="text-red-300 font-bold text-xs mt-1 block">Rupture</span>';
        const opacityClass = p.inStock ? '' : 'opacity-60 grayscale';
        let action = userRole==='admin' ? 
            `<div class="flex gap-2">
                <button onclick="openProductModal('edit', ${p.id})" class="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-blue-300 border border-white/5"><i class="ph ph-pencil-simple"></i></button>
                <button onclick="toggleStock(${p.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition">${p.inStock ? 'Stock' : 'Rupture'}</button>
                <button onclick="deleteProduct(${p.id})" class="text-textSoft hover:text-red-300 p-2 rounded-xl hover:bg-red-500/10"><i class="ph ph-trash"></i></button>
            </div>` 
            : 
            (p.inStock ? `<button onclick="addToCart(${p.id})" class="bg-white text-bgMain px-4 py-2 rounded-xl text-xs font-bold hover:bg-accent transition">Acheter</button>` : `<button disabled class="bg-bgMain text-textSoft px-4 py-2 rounded-xl text-xs font-bold">Indisponible</button>`);
        return `<div class="bg-surface rounded-4xl border border-white/5 overflow-hidden flex flex-col ${opacityClass} shadow-lg transition hover:translate-y-1"><div class="h-48 bg-bgMain relative"><img src="${p.image}" class="w-full h-full object-cover"><span class="absolute top-3 right-3 bg-bgMain/80 backdrop-blur-md text-textMain text-[10px] px-3 py-1 rounded-full border border-white/10">${p.category}</span></div><div class="p-5 flex flex-col flex-1"><h3 class="text-textMain font-bold mb-1 truncate">${p.title}</h3><div class="mt-auto flex justify-between items-center pt-4 border-t border-white/5"><div><span class="text-accent font-bold">$${p.price}</span>${stockStatus}</div>${action}</div></div></div>`;
    }).join('');
}

// ... (Cart & Charts - Standard) ...
// === CHARTS ===
function updateDashboard() {
    if(userRole === 'visiteur') return; 
    document.getElementById('totalUsers').innerText = usersList.length;
    document.getElementById('totalProducts').innerText = productsList.length;
    const totalRevenue = ordersList.reduce((acc, o) => acc + parseFloat(o.total), 0);
    document.getElementById('totalValue').innerText = "$" + totalRevenue.toLocaleString();
    renderChart(currentChartType);
}
function changeChartType(type) { currentChartType = type; renderChart(type); }
function renderChart(type) {
    const ctx = document.getElementById('myChart'); if(!ctx) return;
    const categories = {}; productsList.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });
    const labels = Object.keys(categories).length > 0 ? Object.keys(categories) : ['PC', 'Console'];
    const dataReal = Object.values(categories).length > 0 ? Object.values(categories) : [0, 0];
    if(myChart) myChart.destroy();
    const slateColors = ['#84DCC6', '#A5A58D', '#FFE8D6', '#FFB7B2', '#B5E48C'];
    let scaleConfig = {};
    if (type === 'bar' || type === 'line') { scaleConfig = { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#BCCCDC' } }, x: { grid: { display: false }, ticks: { color: '#BCCCDC' } } }; } else if (type === 'radar' || type === 'polarArea') { scaleConfig = { r: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { display: false, backdropColor: 'transparent' }, pointLabels: { color: '#F1F5F9', font: {size: 12} } } }; }
    myChart = new Chart(ctx, { type: type, data: { labels: labels, datasets: [{ label: 'Stock', data: dataReal, backgroundColor: type === 'line' ? 'rgba(132, 220, 198, 0.2)' : slateColors, borderColor: '#84DCC6', borderWidth: type === 'line' ? 2 : 0, borderRadius: 8, fill: type === 'line' }] }, options: { responsive: true, maintainAspectRatio: false, scales: scaleConfig, plugins: { legend: { labels: { color: '#F1F5F9' } } } } });
}

function openCartModal() { document.getElementById('cartModal').classList.remove('hidden'); setTimeout(() => document.getElementById('cartContent').classList.remove('translate-x-full'), 10); renderCartItems(); }
function closeCartModal() { document.getElementById('cartContent').classList.add('translate-x-full'); setTimeout(() => document.getElementById('cartModal').classList.add('hidden'), 300); }
function addToCart(prodId) { const prod = productsList.find(p => p.id === prodId); if(!prod || !prod.inStock) return; cart.push(prod); updateCartCount(); }
function removeFromCart(index) { cart.splice(index, 1); renderCartItems(); updateCartCount(); }
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }
function renderCartItems() { const container = document.getElementById('cartItems'); if(cart.length === 0) { container.innerHTML = '<div class="text-center text-textSoft mt-10">Vide</div>'; document.getElementById('cartTotal').innerText = "$0.00"; return; } let total = 0; container.innerHTML = cart.map((item, index) => { total += parseFloat(item.price); return `<div class="flex items-center gap-3 bg-bgMain p-3 rounded-2xl border border-white/5"><img src="${item.image}" class="w-12 h-12 rounded-xl object-cover"><div class="flex-1"><h4 class="text-textMain text-sm truncate w-32">${item.title}</h4><span class="text-accent text-xs">$${item.price}</span></div><button onclick="removeFromCart(${index})" class="text-textSoft hover:text-red-300"><i class="ph ph-trash"></i></button></div>`}).join(''); document.getElementById('cartTotal').innerText = "$" + total.toLocaleString(); }
function finaliserCommande() { if(cart.length === 0) { alert("Panier vide !"); return; } const totalSum = cart.reduce((acc, item) => acc + parseFloat(item.price), 0); const newOrder = { id: "CMD-" + Math.floor(Math.random() * 10000), client: currentUser, items: cart.length, total: totalSum, status: "En attente", date: new Date().toLocaleDateString() }; ordersList.unshift(newOrder); localStorage.setItem('myOrders', JSON.stringify(ordersList)); if (!clientsList.find(c => c.name === currentUser)) { clientsList.unshift({ id: clientsList.length + 1, name: currentUser, logo: `https://ui-avatars.com/api/?name=${currentUser}&background=10b981&color=fff&bold=true`, contact: "client@email.com", status: "Active", revenue: "$" + totalSum }); localStorage.setItem('myClients', JSON.stringify(clientsList)); } cart = []; updateCartCount(); closeCartModal(); alert("✅ Commande validée !"); updateDashboard(); renderOrders(); }

function renderClients() { const tbody = document.getElementById('clients-tbody'); if(clientsList.length === 0) { tbody.innerHTML = `<tr><td colspan="3" class="p-5 text-center text-textSoft">Aucun client.</td></tr>`; return; } tbody.innerHTML = clientsList.map(c => `<tr class="hover:bg-bgMain/30 border-b border-white/5"><td class="p-5 flex items-center gap-3"><img src="${c.logo}" class="w-8 h-8 rounded-full"><span class="font-bold text-textMain">${c.name}</span></td><td class="p-5 text-textSoft font-mono text-xs">${c.revenue}</td><td class="p-5 text-center"><span class="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400">Active</span></td></tr>`).join(''); }
function confirmerCommande(idStr) { const order = ordersList.find(o => o.id === idStr); if(order) { order.status = "Confirmée"; localStorage.setItem('myOrders', JSON.stringify(ordersList)); renderOrders(); } }

// ✅ RENDER ORDERS (Client voit SES commandes)
function renderOrders() {
    const tbody = document.getElementById('orders-tbody'); 
    let displayList = userRole === 'admin' ? ordersList : ordersList.filter(o => o.client === currentUser);
    if (displayList.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="p-5 text-center text-textSoft">Aucune commande.</td></tr>`; return; } 
    tbody.innerHTML = displayList.map(o => { 
        let statusBadge = o.status === 'Confirmée' ? `<span class="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">Confirmée</span>` : `<span class="px-2 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400">En attente</span>`; 
        let actionBtn = (userRole === 'admin' && o.status !== 'Confirmée') ? `<button onclick="confirmerCommande('${o.id}')" class="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg hover:bg-emerald-500/30">Valider</button>` : ''; 
        return `<tr class="hover:bg-bgMain/30 border-b border-white/5 transition"><td class="p-5"><span class="font-mono text-accent bg-accent/10 px-2 py-1 rounded text-xs">#${o.id}</span></td><td class="p-5 text-textMain">${o.client}</td><td class="p-5 text-textMain font-bold">$${o.total}</td><td class="p-5 text-center flex justify-center items-center gap-2">${statusBadge}${actionBtn}</td></tr>` 
    }).join(''); 
}

function submitReview() {
    const text = document.getElementById('reviewText').value; const stars = document.getElementById('reviewStars').value; if(!text) return alert("Avis vide !");
    reviewsList.unshift({ id: Date.now(), user: currentUser, role: userRole === 'admin' ? 'Admin' : 'Client', text: text, stars: parseInt(stars) });
    localStorage.setItem('myReviews', JSON.stringify(reviewsList)); document.getElementById('reviewText').value = ''; renderReviews(); alert("Avis publié !");
}
function renderReviews() { document.getElementById('reviews-grid').innerHTML = reviewsList.map(r => `<div class="bg-surface p-6 rounded-4xl border border-white/5 hover:border-accent/30 transition shadow-lg"><div class="flex justify-between mb-3"><span class="text-textMain font-bold flex items-center gap-2">${r.user} <span class="text-[10px] bg-bgMain px-2 py-0.5 rounded-full text-textSoft font-normal uppercase">${r.role}</span></span> <span class="text-yellow-400 text-xs">${'⭐'.repeat(r.stars)}</span></div><p class="text-textSoft text-sm italic">"${r.text}"</p></div>`).join(''); }

// MODALS
function openModal() { document.getElementById('userModal').classList.remove('hidden'); document.getElementById('userModal').classList.add('flex'); }
function closeModal() { document.getElementById('userModal').classList.add('hidden'); document.getElementById('userModal').classList.remove('flex'); }
function closeProductModal() { document.getElementById('productModal').classList.add('hidden'); document.getElementById('productModal').classList.remove('flex'); }

// ==========================================
// === 5. EXPORT FUNCTIONS (PDF & CSV) 🚀 ===
// ==========================================

// 1. EXPORT CSV
function exportToCSV() {
    if (productsList.length === 0) return alert("Aucune donnée à exporter !");

    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Titre,Prix,Categorie,Stock\n"; // En-têtes

    // Rows
    productsList.forEach(p => {
        let row = `${p.id},"${p.title}",${p.price},${p.category},${p.inStock ? 'Oui' : 'Non'}`;
        csvContent += row + "\n";
    });

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "produits_mymanager.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 2. EXPORT PDF
function exportToPDF() {
    if (productsList.length === 0) return alert("Aucune donnée à exporter !");
    
    const { jsPDF } = window.jspdf; // Import mn library
    const doc = new jsPDF();

    // Titre
    doc.text("Liste des Produits - MyManager", 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);

    // Data Table
    const tableColumn = ["ID", "Titre", "Prix ($)", "Catégorie", "Stock"];
    const tableRows = [];

    productsList.forEach(p => {
        const productData = [
            p.id,
            p.title,
            p.price,
            p.category,
            p.inStock ? "Oui" : "Rupture"
        ];
        tableRows.push(productData);
    });

    // Génération Tableau (AutoTable)
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [71, 94, 103] } // Couleur #475E67 (Slate)
    });

    // Save
    doc.save("produits_mymanager.pdf");
}




