/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as buildSite from "../buildSite.js";
import type * as deployments from "../deployments.js";
import type * as http from "../http.js";
import type * as imageHelpers from "../imageHelpers.js";
import type * as images from "../images.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_projectBuildDetect from "../lib/projectBuildDetect.js";
import type * as lib_r2Config from "../lib/r2Config.js";
import type * as lib_staticSite from "../lib/staticSite.js";
import type * as lib_utils from "../lib/utils.js";
import type * as r2 from "../r2.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as sites from "../sites.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  buildSite: typeof buildSite;
  deployments: typeof deployments;
  http: typeof http;
  imageHelpers: typeof imageHelpers;
  images: typeof images;
  "lib/auth": typeof lib_auth;
  "lib/projectBuildDetect": typeof lib_projectBuildDetect;
  "lib/r2Config": typeof lib_r2Config;
  "lib/staticSite": typeof lib_staticSite;
  "lib/utils": typeof lib_utils;
  r2: typeof r2;
  seed: typeof seed;
  seedData: typeof seedData;
  sites: typeof sites;
  templates: typeof templates;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
