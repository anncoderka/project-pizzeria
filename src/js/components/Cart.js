import { settings, select, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
    constructor(element) {
        const thisCart = this;
        thisCart.products = [];
        thisCart.getElements(element);
        thisCart.initActions();
    }
    getElements(element) {
        const thisCart = this;
        thisCart.dom = {};
        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
        thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
        thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
        thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
        thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
        thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
        thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
    }
    initActions() {
        const thisCart = this;
        thisCart.dom.toggleTrigger.addEventListener('click', function () {
            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });
        thisCart.dom.productList.addEventListener('updated', function () {
            thisCart.update();
        });
        thisCart.dom.productList.addEventListener('remove', function (event) {
            thisCart.remove(event.detail.cartProduct);
        });
        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisCart.sendOrder();
        });
    }
    sendOrder() {
        const thisCart = this;
        const url = settings.db.url + '/' + settings.db.orders;
        const payload = {
            address: thisCart.dom.address.value,
            phone: thisCart.dom.phone.value,
            totalPrice: thisCart.totalPrice,
            subtotalPrice: thisCart.totalPrice - thisCart.deliveryFee,
            totalNumber: thisCart.totalNumber,
            deliveryFee: thisCart.deliveryFee,
            products: [],
        };
        for (let prod of thisCart.products) {
            payload.products.push(prod.getData());
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };
        fetch(url, options)
            .then(function (response) {
                return response.json();
            }).then(function (parsedResponse) {
                console.log('parsedResponse', parsedResponse);
            });
    }
    remove(cartProduct) {
        const thisCart = this;
        const indexOfProduct = thisCart.products.indexOf(cartProduct);
        thisCart.products.splice(indexOfProduct, 1);
        cartProduct.dom.wrapper.innerHTML = '';
        thisCart.update();
    }
    add(menuProduct) {
        const thisCart = this;
        const generatedHTML = templates.cartProduct(menuProduct);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        thisCart.dom.productList.appendChild(generatedDOM);
        thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
        thisCart.update();
    }
    update() {
        const thisCart = this;
        thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
        thisCart.totalNumber = 0;
        let subtotalPrice = 0;
        for (let product of thisCart.products) {
            thisCart.totalNumber += product.amount;
            subtotalPrice += product.price;
        }
        if (thisCart.products.length > 0) {
            thisCart.totalPrice = subtotalPrice + thisCart.deliveryFee;
        } else {
            thisCart.totalPrice = 0;
            console.log('deliveryFee zero');
            thisCart.deliveryFee = 0;
        }
        thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
        thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
        for (let totalPriceEl of thisCart.dom.totalPrice) {
            totalPriceEl.innerHTML = thisCart.totalPrice;
        }
    }
}

export default Cart;