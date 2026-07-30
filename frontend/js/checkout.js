// ================================
// AFRISHOP — Page Commande JS
// ================================

let deliveryPrice = 0;
let discount = 0;

const promoCodes = {
    'BIENVENUE20': { type: 'percent', value: 20, label: '20% de réduction' },
    'AFRIQUE10': { type: 'percent', value: 10, label: '10% de réduction' },
    'DAKAR500': { type: 'fixed', value: 500, label: '500 F de réduction' },
    'DIASPORA15': { type: 'percent', value: 15, label: '15% de réduction' },
};

const deliveryOptions = {
    sn: [
        { name: 'Livraison Dakar', time: "Aujourd'hui ou demain", price: 2000 },
        { name: 'Livraison nationale', time: '2 - 4 jours ouvrés', price: 3500 },
        { name: 'Retrait en point relais', time: 'Sous 24h', price: 0 },
    ],
    fr: [
        { name: 'Colissimo', time: '7 - 10 jours', price: 15000 },
        { name: 'DHL Express', time: '3 - 5 jours', price: 25000 },
    ],
    us: [
        { name: 'DHL Express', time: '5 - 7 jours', price: 30000 },
        { name: 'FedEx International', time: '4 - 6 jours', price: 35000 },
    ],
    ci: [
        { name: 'La Poste CI', time: '3 - 5 jours', price: 5000 },
        { name: 'DHL Afrique', time: '2 - 3 jours', price: 8000 },
    ],
    default: [
        { name: 'DHL International', time: '5 - 10 jours', price: 25000 },
        { name: 'FedEx International', time: '4 - 7 jours', price: 30000 },
    ]
};

// ================================
// CHARGER LE PANIER
// ================================
function loadCart() {
    const items = document.getElementById('cart-items');
    if (!items) return;

    if (cart.length === 0) {
        items.innerHTML = `
            <div style="text-align:center; padding:20px; color:#888">
                <div style="font-size:32px; margin-bottom:8px">🛒</div>
                <p>Votre panier est vide</p>
                <a href="product.html" style="color:#A07830">Continuer mes achats →</a>
            </div>`;
        updateSummary();
        return;
    }

    items.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img">${escapeHtml(item.emoji)}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-qty">Quantité : ${item.quantity}</div>
            </div>
            <div class="cart-item-price">
                ${(item.price * item.quantity).toLocaleString()} F
            </div>
        </div>
    `).join('');

    updateSummary();
}

// ================================
// METTRE A JOUR LE RÉSUMÉ
// ================================
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + deliveryPrice - discount;

    document.getElementById('subtotal').textContent = subtotal.toLocaleString() + ' F';
    document.getElementById('delivery-price').textContent =
        deliveryPrice === 0 ? 'Gratuit' : deliveryPrice.toLocaleString() + ' F';
    document.getElementById('total').textContent = total.toLocaleString() + ' F';
}

// ================================
// OPTIONS DE LIVRAISON
// ================================
function updateDelivery(country) {
    const opts = deliveryOptions[country] || deliveryOptions.default;
    const container = document.getElementById('delivery-options');

    container.innerHTML = opts.map((opt, i) => `
        <label class="delivery-opt ${i === 0 ? 'selected' : ''}"
               onclick="selectDelivery(this, ${opt.price})">
            <input type="radio" name="delivery" ${i === 0 ? 'checked' : ''}>
            <div class="delivery-opt-info">
                <div class="delivery-opt-name">${opt.name}</div>
                <div class="delivery-opt-time">${opt.time}</div>
            </div>
            <div class="delivery-opt-price">
                ${opt.price === 0 ? 'Gratuit' : opt.price.toLocaleString() + ' F'}
            </div>
        </label>
    `).join('');

    deliveryPrice = opts[0].price;
    updateSummary();
}

function selectDelivery(el, price) {
    document.querySelectorAll('.delivery-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    deliveryPrice = price;
    updateSummary();
}

// ================================
// PAIEMENT
// ================================
function selectPay(el, type) {
    document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');

    const fields = document.getElementById('pay-fields');

    if (type === 'wave') {
        fields.innerHTML = `
            <label>Numéro Wave</label>
            <input type="tel" placeholder="+221 77 000 00 00">`;
    } else if (type === 'orange') {
        fields.innerHTML = `
            <label>Numéro Orange Money</label>
            <input type="tel" placeholder="+221 77 000 00 00">`;
    } else if (type === 'card') {
        fields.innerHTML = `
            <label>Numéro de carte</label>
            <input type="text" placeholder="1234 5678 9012 3456" maxlength="19">
            <div class="card-row">
                <div>
                    <label>Date d'expiration</label>
                    <input type="text" placeholder="MM/AA">
                </div>
                <div>
                    <label>CVV</label>
                    <input type="text" placeholder="123" maxlength="3">
                </div>
            </div>
            <label>Nom sur la carte</label>
            <input type="text" placeholder="MAMADOU DIALLO">`;
    } else if (type === 'paypal') {
        fields.innerHTML = `
            <label>Email PayPal</label>
            <input type="email" placeholder="email@paypal.com">`;
    }
}

// ================================
// CODE PROMO
// ================================
function applyPromo() {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    const result = document.getElementById('promo-result');
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (promoCodes[code]) {
        const promo = promoCodes[code];
        if (promo.type === 'percent') {
            discount = Math.round(subtotal * promo.value / 100);
        } else {
            discount = promo.value;
        }
        result.className = 'success';
        result.textContent = `✓ Code ${code} appliqué — ${promo.label} !`;
        updateSummary();
    } else {
        discount = 0;
        result.className = 'error';
        result.textContent = '✗ Code invalide. Essayez : BIENVENUE20';
        updateSummary();
    }
}

// ================================
// CONFIRMER LA COMMANDE
// ================================
async function confirmOrder() {
    const prenom = document.getElementById('prenom').value;
    const nom = document.getElementById('nom').value;
    const tel = document.getElementById('tel').value;
    const email = document.getElementById('email').value;
    const adresse = document.getElementById('adresse').value;
    const pays = document.getElementById('pays').value;

    if (!prenom || !nom || !tel || !email || !adresse) {
        showNotif('⚠️ Veuillez remplir tous les champs !');
        return;
    }

    if (cart.length === 0) {
        showNotif('⚠️ Votre panier est vide !');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderData = {
        prenom, nom, email,
        telephone: tel,
        pays, adresse,
        subtotal,
        delivery_price: deliveryPrice,
        discount,
        total: subtotal + deliveryPrice - discount,
        payment_method: document.querySelector('.pay-option.selected .pay-name')?.textContent || 'Wave',
        delivery_method: document.querySelector('.delivery-opt.selected .delivery-opt-name')?.textContent || 'Livraison',
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (data.success) {
            localStorage.removeItem('afrishop_cart');
            cart = [];
            document.getElementById('confirm-ref').textContent = data.reference;
            document.querySelector('.checkout-layout').style.display = 'none';
            document.querySelector('.checkout-steps').style.display = 'none';
            document.getElementById('confirmation-screen').style.display = 'block';
        } else {
            showNotif('⚠️ ' + data.message);
        }
    } catch (err) {
        console.error('Erreur commande:', err);
        showNotif('⚠️ Erreur de connexion au serveur');
    }
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateDelivery('sn');
    updateCartCount();
});