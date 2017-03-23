import _ from 'lodash';
export default function GetIndexPatternIdsFn(esAdmin, kbnIndex, userManagement) {

  // many places may require the id list, so we will cache it seperately
  // didn't incorportate with the indexPattern cache to prevent id collisions.
  let cachedPromise;

  let getIds = function () {
    if (cachedPromise) {
      // retrun a clone of the cached response
      return cachedPromise.then(function (cachedResp) {
        return _.clone(cachedResp);
      });
    }

    cachedPromise = esAdmin.search({
      index: kbnIndex,
      type: 'index-pattern',
      storedFields: [],
      body: {
        query: { match_all: {} },
        size: 10000
      }
    })
    .then(function (resp) {
      return filterIndices(_.pluck(resp.hits.hits, '_id'), authorizedIndices());
    });

    // ensure that the response stays pristine by cloning it here too
    return cachedPromise.then(function (resp) {
      return _.clone(resp);
    });
  };

  function authorizedIndices() {
    var userManagementData = userManagement.getUser();
    if (typeof userManagementData.then === 'function') {
      return userManagementData.then(function (result) {
         // this is only run after getUser() resolves
        return result.indices;
      });
    }
    else
    {
      return userManagementData.indices;
    }
  }

  function filterIndices(a, b)
  {
    var t;
    if (b.length > a.length) {
      t = b;
      b = a;
      a = t;
    } // indexOf to loop over shorter
    return a.filter(function (e) {
      return b.indexOf(e) > -1;
    });
  }


  getIds.clearCache = function () {
    cachedPromise = null;
  };

  return getIds;
};
