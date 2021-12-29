import isEmpty from 'lodash/isEmpty';
import { Notify } from 'quasar';
import { route } from 'quasar/wrappers';
import { userStore } from 'src/store/user-store';
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      const userPermissionStore = userStore();
      if (isEmpty(userPermissionStore.userPermission)) {
        await userPermissionStore.checkUserPermission();
      }
      if (!isEmpty(userPermissionStore.userPermission)) {
        next();
      } else {
        Notify.create({
          color: 'negative',
          icon: 'mdi-alert-circle-outline',
          message: "You don't have permission.",
        });
        next('/');
      }
    } else {
      next();
    }
  });

  return Router;
});
