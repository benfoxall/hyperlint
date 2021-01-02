#!/usr/bin/env node

import fetch from "node-fetch";
import { parse } from "node-html-parser";
import isAbsolute from "is-absolute-url";
import join from "url-join";
import ora from "ora";
import UserAgent from "user-agents";
import Headers from "fetch-headers";

const checklink = async (url) => {
  const userAgent = new UserAgent();

  const headers = new Headers();
  headers.set("USER-AGENT", userAgent.toString());

  let res = await fetch(url, { method: "HEAD", headers });

  if (res.status === 405) {
    res = await fetch(url, { headers });
  }

  return res.ok;
};

const parallel = async (_queue, n = 1) =>
  new Promise((resolve) => {
    const queue = _queue.slice(0);

    const run = () => {
      const next = queue.shift();
      if (next) Promise.resolve(next()).then(run);
      else if (--n === 0) resolve();
    };

    for (let i = 0; i < n; i++) {
      run();
    }
  });

const lintIt = async (address) => {
  const res = await fetch(address);
  const text = await res.text();
  const dom = parse(text);

  let invalid = 0;
  let working = 0;
  const notWorking = [];

  const queue = Array.from(dom.querySelectorAll("a"), (el) => async () => {
    let url = el.getAttribute("href");

    if (!url) {
      invalid++;
    }

    if (!isAbsolute(url)) {
      url = join(address, url);
    }

    const spinner = ora(url).start();

    const check = await checklink(url);

    if (check) {
      working++;

      spinner.succeed();
    } else {
      notWorking.push(url);

      spinner.fail();
    }
  });

  await parallel(queue, 10);

  console.log("WORKING", working);
  console.log("NOT WORKING", notWorking.length);
  if (notWorking.length) {
    console.log(notWorking);
  }
  console.log("INVALID", invalid);
};

const url = process.argv[2];

if (url) {
  lintIt(url);
} else {
  console.warn("usage: npx hyperlint http://yoursite.com");
}
