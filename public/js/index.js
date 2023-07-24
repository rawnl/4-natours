import '@babel/polyfill';
import { displayMap } from './maplibre';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

// DOM elements
const mapLibre = document.getElementById('map');
const loginFrom = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// Values

// Delegation
if (mapLibre) {
    const locations = JSON.parse(mapLibre.dataset.locations);
    displayMap(locations);
}

if (loginFrom) {
    console.log(email, password);
    loginFrom.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if (logoutBtn) {
    console.log('exists');
    logoutBtn.addEventListener('click', logout);
}

if (userDataForm)
    userDataForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        updateSettings({ name, email }, 'data');
    });

if (userPasswordForm)
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent =
            'Updating...';
        const passwordCurrent =
            document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm =
            document.getElementById('password-confirm').value;

        await updateSettings(
            { passwordCurrent, password, passwordConfirm },
            'password'
        );

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
        document.querySelector('.btn--save-password').textContent =
            'Save password';
    });
