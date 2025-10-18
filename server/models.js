//this file defines typeps

/** @typedef {{id:string,name:string,location:string,skills:string[]}} Volunteer */
/** @typedef {{id:string,name:string,location:string,requiredSkills:string[],date:string,urgency:"Low"|"Medium"|"High"}} EventItem */
/** @typedef {{id:string,volunteerId:string,eventId:string,createdAt:number}} Assignment */
/** @typedef {{id:string,volunteerId:string,title:string,body?:string,type?:"info"|"success"|"warn"|"error",createdAt:number}} Notice */
/** @typedef {{
 *   userId:string,
 *   fullName:string,
 *   location:{
 *     address1:string,
 *     address2?:string,
 *     city:string,
 *     state:string,
 *     zipCode:string,
 *   },
 *   skills:string[],
 *   preferences?:string,
 *   availability:string[],
 * }} Profile */

export {};
