import { resolve } from 'path';
import authenticationRoute from './server/routes/authentication';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],

    uiExports: {

    devTools: {
      title: 'Kibana Auth',
      description: 'An awesome Kibana plugin',
      main: 'plugins/kibana_auth/app'
    },

    // Logout functionality as a ui_nav_link. Refer: ui_nav_link.js
    link:{

      title: 'Logout',
      order: 10000,
      url: '/logout',

    }

    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    
    init(server, options) {
      // Add server routes and initalize the plugin here
      authenticationRoute(server);
    }
    

  });
};
