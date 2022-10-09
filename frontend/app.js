const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const fileupload = require('express-fileupload');
const expressSession = require('express-session');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload());


const sessionConfig = {
    secret: 'Api',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60 * 60 * 24
    }
};

app.use(expressSession(sessionConfig));

app.get('/', authorizeUser, async function (req, res) {
    try {
        let data = {
            title: 'Shop',
            page: 'shop',
            products: []
        };

        let endpoint = 'http://localhost:5000/admin/product';
        const result = await axios.get(endpoint);
        if (result && result.data && result.data.products) {
            data.products = result.data.products;
        }
        res.render('template', data);
    } catch (error) {
        console.log("Error", error);
    }
});

app.get('/users', authorizeUser, async function (req, res) {
    try {
        let data = {
            title: 'All Users',
            page: 'users',
            users: []
        };

        let token = req.session.token;
        let endpoint = 'http://localhost:5000/user';
        const result = await axios.get(endpoint, {
            headers: {
                authorization: 'Bearer ' + token
            }
        });
        if (result && result.data && result.data.users) {
            data.users = result.data.users;
        }

        res.render('template', data);
    } catch (error) {
        if (error.response && error.response.status && error.response.status == 403) {
            req.session.status = "Error";
            req.session.message = error.response.data.message;
            delete req.session.token;
            res.redirect('/login');
        }
        console.log("Error", error);
    }
});

app.get('/register', function (req, res) {
    let data = {
        title: 'Registration',
        page: 'register',
        status: '',
        message: ''
    };
    if (req.session.status && req.session.message) {
        data.status = req.session.status;
        data.message = req.session.message;
        delete req.session.status, req.session.message;
    }
    res.render('template', data);
});

app.post('/register', async function (req, res) {
    try {
        // console.log('req.body', req.body);
        let bodyData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.userEmail,
            password: req.body.password,
            gender: req.body.gender,
            contact: req.body.contact
        };
        let endpoint = 'http://localhost:5000/user/register';
        const result = await axios.post(endpoint, bodyData);
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        console.log("error.data", error.response.data);
        if (error && error.response.data && error.response.data.status && error.response.data.status == "Error") {
            req.session.status = "Error";
            req.session.message = error.response.data.message;
            res.redirect('/register');
        }
    }
});

app.get('/login', function (req, res) {
    let data = {
        title: 'Login Portal',
        page: 'login',
        status: '',
        message: ''
    };
    if (req.session.status && req.session.message) {
        data.status = req.session.status;
        data.message = req.session.message;
        delete req.session.status, req.session.message;
    }
    res.render('template', data);
});

app.post('/login', async function (req, res) {
    try {
        console.log('req.body', req.body);
        let userData = {
            email: req.body.username,
            password: req.body.password
        }
        let endpoint = 'http://localhost:5000/user/login';
        const result = await axios.post(endpoint, userData);
        console.log("result", result.data.token);
        req.session.token = result.data.token;
        res.redirect('/');
    } catch (error) {
        console.log('Error Login:::', error);
        console.log("error.data", error.response.data);
        if (error && error.response.data) {
            if (error.response.data.status && error.response.data.status == "Error") {
                req.session.status = "Error";
                req.session.message = error.response.data.message;
            } else if (error.response.data.message) {
                req.session.status = "Error";
                req.session.message = error.response.data.message;
            }
            res.redirect('/login');
        }
    }
});

app.get('/logout', function (req, res) {
    if (req.session.token) {
        delete req.session.token;
    }
    res.redirect('/login');
});

function authorizeUser(req, res, next) {
    if (!req.session.token) {
        req.session.status = "Error";
        req.session.message = "Session Expired";
        res.redirect('/login');
        return false;
    }
    next();
}

const port = 5001;
app.listen(port, function () {
    console.log(`Server Started at Port ${port}`);
});