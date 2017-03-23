// autoloading

// preloading (for faster webpack builds)
import moment from 'moment-timezone';
import chrome from 'ui/chrome';
import routes from 'ui/routes';
import modules from 'ui/modules';

import kibanaLogoUrl from 'ui/images/kibana.svg';
import 'ui/autoload/all';
import 'plugins/kibana/discover/index';
import 'plugins/kibana/visualize/index';
import 'plugins/kibana/dashboard/index';
import 'plugins/kibana/management/index';
import 'plugins/kibana/doc';
import 'plugins/kibana/dev_tools';
import 'ui/vislib';
import 'plugins/haystack_auth/user_management';
import 'ui/agg_response';
import 'ui/agg_types';
import 'ui/timepicker';
import Notifier from 'ui/notify/notifier';
import 'leaflet';

routes.enable();

routes
.otherwise({
  redirectTo: `/${chrome.getInjected('kbnDefaultAppId', 'discover')}`
});

chrome
.setRootController('kibana', function ($scope, courier, config, userManagement, $window) {
  // wait for the application to finish loading
  $scope.$on('application.load', function () {
    courier.start();
  });

  $scope.$on('$routeChangeStart', function (angularEvent, next, current) {
    if (next.requireAuth && authorized(next) === undefined) {
        // User isn’t authenticated
      $window.location.href = '/logout';
    }
  });

  config.watch('dateFormat:tz', setDefaultTimezone, $scope);
  config.watch('dateFormat:dow', setStartDayOfWeek, $scope);

  function authorized(next) {
    var userManagementData = userManagement.getUser();
    if (typeof userManagementData.then === 'function') {
      return userManagementData.then(function (result) {
         // this is only run after getUser() resolves
        return result.authorized_sections.find(includeSection, next);
      });
    }
    else
    {
      return userManagementData.authorized_sections.find(includeSection, next);
    }

  }

  function includeSection(sec) {
    if (sec === '*')
    {
      return true;
    }
    else
    {
      var sectionName = sec.split(':').pop();
      var path = this.$$route.originalPath.replace('/', '');
      return path.startsWith(sectionName);
    }
  }

  function setDefaultTimezone(tz) {
    moment.tz.setDefault(tz);
  }

  function setStartDayOfWeek(day) {
    const dow = moment.weekdays().indexOf(day);
    moment.updateLocale(moment.locale(), { week: { dow } });
  }
});

modules.get('kibana').run(Notifier.pullMessageFromUrl);
