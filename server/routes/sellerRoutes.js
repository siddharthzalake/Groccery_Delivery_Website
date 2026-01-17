import express from 'express'
import { sellerIsAuth, sellerLogin, sellerLogout } from '../controller/sellerController.js';
import authSeller from '../middlewares/authSeller.js';

const sellerRouter = express.Router();

sellerRouter.post('/login',sellerLogin);
sellerRouter.get('/is-auth',authSeller,sellerIsAuth);
sellerRouter.get('/logout',authSeller,sellerLogout);


export default sellerRouter