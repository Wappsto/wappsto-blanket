import { getServiceVersion } from 'wappsto-redux/util/helpers';
import { openStream, closeStream, updateStream as updateReduxStream } from 'wappsto-redux/actions/stream';
import config from 'wappsto-redux/config';

export function getLastKey(data){
  if(!data){
    return undefined;
  }
  let keys = Object.keys(data);
  return keys[keys.length - 1];
}

export function getNextKey(data){
  const lastKey = getLastKey(data) || 0;
  return parseInt(lastKey) + 1;
}

function mergeUnique(arr1, arr2){
  let arr = [...arr1];
  arr2.forEach(e => {
    if(!arr1.includes(e)){
      arr.push(e);
    }
  });
  return arr;
}

const defaultOptions = {
  endPoint: 'websocket',
  version: '2.0'
};
const subscriptions = {};
const subscriptionNumber = {};
let timeout;
function removeArr(arr1, arr2){
  return arr1.filter(path => {
    if((!subscriptionNumber[path] || subscriptionNumber[path] < 1) && arr2.find(path2 => path2 === path)){
      return false;
    }
    return true;
  });
}

function updateSubscriptionNumber(subscriptions, number=1){
  subscriptions.forEach(path => {
    subscriptionNumber[path] = (subscriptionNumber[path] || 0) + number;
    if(subscriptionNumber[path] < 1){
      delete subscriptionNumber[path];
    }
  });
}

const mainStream = 'stream-main';
const secondaryStream = 'stream-secondary';
const arrayEqual = (arr1, arr2) => {
  if(arr1.length !== arr2.length){
    return false;
  }
  for(let i = 0; i < arr1.length; i++){
    if(arr2.indexOf(arr1[i]) === -1){
      return false;
    }
  }
  return true;
}
export function updateStream(dispatch, subscription, type, options=defaultOptions){
  if(subscription.length === 0){
    return;
  }
  if(!subscriptions.old){
    if(type === 'add'){
      clearTimeout(timeout);
      subscriptions.old = subscription;
      dispatch(openStream({ name: mainStream, subscription, full: options.full || false }, null, options));
      updateSubscriptionNumber(subscription, 1);
    }
  } else {
    clearTimeout(timeout);
    let newSubscriptions;
    let func;
    if(type === 'add'){
      func = mergeUnique;
      updateSubscriptionNumber(subscription, 1);
    } else {
      func = removeArr;
      updateSubscriptionNumber(subscription, -1);
    }
    if(subscriptions.new){
      newSubscriptions = func(subscriptions.new, subscription);
      subscriptions.new = null;
      if(arrayEqual(newSubscriptions, subscriptions.old)){
        return;
      }
      dispatch(closeStream(secondaryStream));
    } else {
      newSubscriptions = func(subscriptions.old, subscription);
    }
    subscriptions.new = newSubscriptions;
    if(newSubscriptions.length > 0){
      if(arrayEqual(newSubscriptions, subscriptions.old)){
        return;
      }
      timeout = setTimeout(() => {
        const ws = dispatch(openStream({ name: secondaryStream, subscription: newSubscriptions, full: options.full || false }, null, options));
        ws.addEventListener('open', () => {
          dispatch(closeStream(mainStream, true));
          dispatch(updateReduxStream(mainStream, null, null, ws, { subscription: newSubscriptions, name: mainStream, full: options.full || false }));
          subscriptions.old = subscriptions.new;
          subscriptions.new = null;
        });
      }, 500);
    } else {
      timeout = setTimeout(() => {
        dispatch(closeStream(mainStream));
        subscriptions.old = null;
      }, 500);
    }
  }
}

export function getServiceUrl(service, options){
  const version = options && options.hasOwnProperty('version') ? options.version : getServiceVersion(service);
  return config.baseUrl + (version ? '/' + version : '') + '/' + service;
}

export function matchObject(obj1, obj2) {
  for (const key in obj2) {
    if(obj1.hasOwnProperty(key)){
      let left = obj1[key];
      let right = obj2[key];
      if (left && right && left.constructor !== right.constructor) {
        return false;
      } else if (typeof(left) === "object") {
        if (!matchObject(left, right)) {
          return false;
        }
      } else if (left !== right) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

export function isPrototype(item){
  return item.meta && !item.meta.iot && !item.meta.application;
}

export function cannotAccessState(state){
  return state.status_payment === 'not_shared' || state.status_payment === 'not_paid' || state.status_payment === 'open';
}

export function matchArray(arr1 = [], arr2 = []){
  if(arr1.length !== arr2.length){
    return false;
  } else {
    for(let i = 0; i < arr1.length; i ++){
      if(arr2.indexOf(arr1[i]) === -1){
        return false;
      }
    }
  }
  return true;
}
