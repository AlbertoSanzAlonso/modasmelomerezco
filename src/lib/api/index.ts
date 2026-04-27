
import { products } from './products';
import { collections } from './collections';
import { customers } from './customers';
import { auth } from './auth';
import { orders } from './orders';
import { storage } from './storage';
import { shipping } from './shipping';
import { addresses } from './addresses';
import { locations } from './locations';
import { paymentMethods } from './paymentMethods';
import { mailApi as mail } from './mail';
import { admins } from './admins';
import { favorites } from './favorites';
import { subscriptions } from './subscriptions';
import { categories } from './categories';

export const api = {
  products,
  collections,
  customers,
  auth,
  orders,
  storage,
  shipping,
  addresses,
  locations,
  paymentMethods,
  mail,
  admins,
  favorites,
  subscriptions,
  categories
};

export default api;
