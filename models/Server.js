const express = require('express');
const {request, response} = require('express');
const bodyparser = require('body-parser')
const cors = require('cors');
const { dbConnection } = require("../database/dbConnection");

const http = require('http');
const logger = require('morgan');
const path = require('path');
const router = require('../routes/auth');
const { auth } = require('express-openid-connect');


class Server {


    constructor (){
        this.app = express();
        this.PORT = process.env.PORT || 8000
        this.config = {
            authRequired: false,
            auth0Logout: true
        };
        
        if (!this.config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
            this.config.baseURL = `http://localhost:${this.PORT}`;
        }
        //Conexion a base de datos
        this.dbConnect();

        //Middlewares 
        this.middlewares();

        //Rutas
        this.routes();
        
        

    }

    async dbConnect(){
        await dbConnection();
    }

    routes(){
        this.app.get('/', async(request,response)=>{
            response.send('<h1>Hola</h1>')
        });
    }

    middlewares(){
        this.app.use(bodyparser.urlencoded({extended: false}));
        this.app.use(bodyparser.json());
        this.app.use(cors());
        this.app.set('views', path.join('views'));
        this.app.set('view engine', 'ejs');
        this.app.use(logger('dev'));
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        this.app.use(auth(this.config));

        // Middleware to make the `user` object available for all views
        this.app.use(function (req, res, next) {
            res.locals.user = req.oidc.user;
            next();
        });

        this.app.use('/', router);

        // Catch 404 and forward to error handler
        this.app.use(function (req, res, next) {
            const err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        //Error handler
        this.app.use(function (err, req, res, next) {
          res.status(err.status || 500);
          res.render('error', {
            message: err.message,
            error: process.env.NODE_ENV !== 'production' ? err : {}
          });
        });

        
    }

    listen(){
        this.app.listen(this.PORT,()=>{
            console.log(`Servidor ON!✅ localhost:${this.PORT}`);
        })
    }
}

module.exports = Server
