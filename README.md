# gatsby-plugin-csp-nonce

## What is a Content Security Policy (CSP)? 
[Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) is a computer security standard introduced to prevent cross-site scripting (XSS), clickjacking and other data injection attacks. These attacks execute malicious code in the trusted web page context. It is widely supported by modern web browsers as it improves website security.

With a Content Security Policy you simply declare what sources of content are allowed to be loaded from a web page (Like CSS, Javscript, Images, iframes etc.). Untrusted sources cannot be executed, preventing XSS and other data injection attacks.

### Existing solutions & implications
To implement a CSP on your Gatsby website, there is a plugin called `gatsby-plugin-csp`. This plugin relies upon creating hashes and adding those in a `<meta>`-tag. This `<meta>`-tag has limited browser support (Source: [Can I use](https://caniuse.com/mdn-http_headers_csp_content-security-policy_meta-element-support)). Therefore, setting `Content-Security-Policy` in the HTTP headers is the best supported alternative.

Besides, many rely upon a plugin called `gatsby-plugin-image` (GatsbyImage & StaticImage) for processing images on their Gatsby application. `gatsby-plugin-image` creates inline styles, but `gatsby-plugin-csp` doesn't offer support for that ([Source](https://github.com/bejamas/gatsby-plugin-csp/issues/3)). A resolution might be to use 'unsafe-inline'. Hench the name, it is generally not recommended to use (see for more information: https://content-security-policy.com/unsafe-inline/).

### Solution
A solution is to use CSP level 3 feature called `strict-dynamic` ([read-more](https://content-security-policy.com/strict-dynamic/)). This will use a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) (randomly generated number), which changes every page request.
As such, there no need to generate `sha-256` or whitelist hosts anymore.

## What does this plugin do

`gatsby-plugin-csp-nonce` adds a fixed nonce to inline styles and scripts.

Having a fixed nonce on the right placed in your Gatsby code does half the job. The other part is making sure that during a page request this nonce will be replaced by a randomly generated nonce.

Different hosting providers have solutions for this, but it is not in the scope of this plugin;
- [CloudFlare Worker](https://github.com/moveyourdigital/cloudflare-worker-csp-nonce) (Solution by [Lightningspirit](https://github.com/lightningspirit))

## Install

`npm i gatsby-plugin-csp-nonce`

or

`yarn add gatsby-plugin-csp-nonce`

## How to use

### Step 1: Load the plugin in your Gatsby website
```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [`gatsby-plugin-csp-nonce`]
};
```

This will add the plugin and add `nonce="nonce-DhcnhD3khTMePgXw"` to your scripts and styles. By default the plugin is only visible in production mode (`gatsby build`).

To add a custom nonce or to see the nonce in development mode (`gatsby develop`), you can use the settings below.

```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-csp-nonce`,
      options: {
          disableOnDev: false,
          nonce: 'my-custom-nonce',
      },
    },
  ]
};
```

### Step 2: Send headers to hosting provider
Set the `Content-Security-Policy` HTTP header. This can be done by setting them in a custom file (e.g. [CloudFlare](https://developers.cloudflare.com/pages/platform/headers/), [Netlify](https://docs.netlify.com/routing/headers/)), or by setting custom headers using a plugin (e.g. [Gatsby Cloud](https://www.gatsbyjs.com/plugins/gatsby-plugin-gatsby-cloud/?=gatsby%20cloud)).  

#### Setting headers with a file
Files placed in the `/static` directory will be copied in the `/public` directory during build time (`Gatbsy build`). Some hosting providers offer support for setting custom headers by placing a 'headers' file in the `/public` directory. For CloudFlare Workers and Netlify a `_headers` can be used to set the headers.

Your hosting provider, might need a different file like `headers.json`, but it is still the same idea.

```text
// In static directory, filename (no extension): _headers
/*
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    Referrer-Policy: no-referrer
    X-XSS-Protection: 1; mode=block
    Strict-Transport-Security: max-age=31536000
    Permission-Policy: accelerometer=(), camera=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), sync-xhr=(), usb=()
    Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-DhcnhD3khTMePgXw' 'strict-dynamic' https://www.google-analytics.com/analytics.js; style-src 'self'; img-src 'self' *.example.com https://www.google-analytics.com/collect; connect-src 'self' *.example.com; font-src 'self'; object-src 'none'; media-src 'none'; frame-src 'none'; child-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; worker-src 'none'; manifest-src 'self'; prefetch-src 'self'; navigate-to 'self';
```