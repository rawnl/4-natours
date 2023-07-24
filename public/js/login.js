import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email,
                password,
            },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Successfully logged in');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout',
        });
        console.log('callllllllled');
        if ((res.data.status = 'success')) {
            //location.replace('/');
            location.reload(true); // true to refrech from the server and not from the user browser cache
        }
    } catch (err) {
        console.log(err.response);
        showAlert('error', 'Error logging out! Try again.');
    }
};
