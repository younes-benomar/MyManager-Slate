const dictionary = {
    fr: {
        nav_dash: "Tableau de bord",
        nav_users: "Utilisateurs",
        nav_products: "Produits",
        nav_clients: "Clients",
        nav_orders: "Commandes",
        nav_reviews: "Avis",
        main_title: "Dashboard",
        sub_title: "Aperçu de vos activités.",
        stat_users: "Utilisateurs",
        stat_stock: "Stock",
        stat_money: "Revenu",
        btn_add: "+ Ajouter",
        btn_new: "+ Nouveau",
        search_ph: "Rechercher...",
        analytics: "Analytique",
        
        // Table Headers
        th_id: "ID",
        th_name: "Nom",
        th_email: "Email",
        th_city: "Ville",
        th_actions: "Actions",
        th_rev: "Revenu",
        th_stat: "Statut",
        th_client: "Client",
        th_total: "Total",
        th_state: "État",

        // Modals
        mod_add_prod: "Ajouter Produit",
        mod_edit_prod: "Modifier Produit",
        mod_new_user: "Nouvel Utilisateur",
        mod_edit_user: "Modifier Utilisateur",
        btn_cancel: "Annuler",
        btn_create: "Créer",
        btn_save: "Sauvegarder",
        
        // Cart
        cart_title: "Mon Panier",
        cart_empty: "Panier vide",
        cart_pay: "Payer maintenant"
    },
    en: {
        nav_dash: "Dashboard",
        nav_users: "Users",
        nav_products: "Products",
        nav_clients: "Customers",
        nav_orders: "Orders",
        nav_reviews: "Reviews",
        main_title: "Dashboard",
        sub_title: "Overview of your activities.",
        stat_users: "Users",
        stat_stock: "Stock",
        stat_money: "Revenue",
        btn_add: "+ Add Item",
        btn_new: "+ New User",
        search_ph: "Search...",
        analytics: "Analytics",

        th_id: "ID",
        th_name: "Name",
        th_email: "Email",
        th_city: "City",
        th_actions: "Actions",
        th_rev: "Revenue",
        th_stat: "Status",
        th_client: "Customer",
        th_total: "Total",
        th_state: "State",

        mod_add_prod: "Add Product",
        mod_edit_prod: "Edit Product",
        mod_new_user: "New User",
        mod_edit_user: "Edit User",
        btn_cancel: "Cancel",
        btn_create: "Create",
        btn_save: "Save",

        cart_title: "My Cart",
        cart_empty: "Empty Cart",
        cart_pay: "Pay Now"
    },
    ar: {
        nav_dash: "لوحة التحكم",
        nav_users: "المستخدمين",
        nav_products: "المنتجات",
        nav_clients: "العملاء",
        nav_orders: "الطلبات",
        nav_reviews: "التقييمات",
        main_title: "لوحة القيادة",
        sub_title: "نظرة عامة على أنشطتك.",
        stat_users: "المستخدمين",
        stat_stock: "المخزون",
        stat_money: "الإيرادات",
        btn_add: "+ إضافة",
        btn_new: "+ جديد",
        search_ph: "بحث...",
        analytics: "تحليلات",

        th_id: "ر.ت",
        th_name: "الاسم",
        th_email: "البريد",
        th_city: "المدينة",
        th_actions: "إجراءات",
        th_rev: "الدخل",
        th_stat: "الحالة",
        th_client: "العميل",
        th_total: "المجموع",
        th_state: "الوضع",

        mod_add_prod: "إضافة منتج",
        mod_edit_prod: "تعديل المنتج",
        mod_new_user: "مستخدم جديد",
        mod_edit_user: "تعديل المستخدم",
        btn_cancel: "إلغاء",
        btn_create: "إنشاء",
        btn_save: "حفظ",

        cart_title: "سلة المشتريات",
        cart_empty: "السلة فارغة",
        cart_pay: "دفع الآن"
    }
};

function setLanguage(lang) {
    localStorage.setItem('selectedLang', lang);
    const htmlTag = document.documentElement; 
    
    // RTL / LTR Logic
    if (lang === 'ar') {
        htmlTag.setAttribute('dir', 'rtl');
        htmlTag.setAttribute('lang', 'ar');
    } else {
        htmlTag.setAttribute('dir', 'ltr');
        htmlTag.setAttribute('lang', lang);
    }

    const selector = document.getElementById('langSelector');
    if(selector) selector.value = lang;

    // Apply translations
    document.querySelectorAll('[data-t]').forEach(element => {
        const key = element.getAttribute('data-t');
        if (dictionary[lang] && dictionary[lang][key]) {
            if(element.tagName === 'INPUT') {
                element.placeholder = dictionary[lang][key];
            } else {
                element.innerText = dictionary[lang][key];
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('selectedLang') || 'fr';
    setLanguage(saved);
});