'use strict'

import SingleConrtroller from './single-controller.js';
import { loopar } from "loopar";

const detectCity = async (request) => {
  const ip = request.ip;
  
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    return { city: "", region: "" };
  }

  const res  = await fetch(`http://ip-api.com/json/${ip}`);
  const data = await res.json();

  return {
    city: data.city   || "",
    region: data.region || "",
  };
}

export default class PageController extends SingleConrtroller {
  client = 'page';
  static inheritedActions = ['view'];
  
  constructor(props) {
    super(props);
  }

  #getApp() {
    return loopar.webApp;
  }

  async publicActionGetReviews() {
    const { limit = 6, offset = 0 } = this.query;
 
    const filter = {parent_id: this.document, approved: 1 };
 
    const reviews = await loopar.db.getList("Review", {
      filter,
      fields: ["name", "author_name", "city", "rating", "comment", "creation", "helpful", "not_helpful"],
      orderBy: "creation desc",
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
 
    return reviews
  }


  async actionView(...args) {
    return await this.sendDocument(...args);
  }

  async publicActionAddReview() {
    const { author_name, city, rating, comment, app } = this.body;
    const _app = this.#getApp();
 
    if (!author_name?.trim()) return this.error("Author name is required.");
    if (!comment?.trim()) return this.error("Comment is required.");
    if (rating < 1 || rating > 5) return this.error("Rating must be between 1 and 5.");
 
    const doc = await loopar.newDocument("Review", {
      name: loopar.utils.randomString(15),
      author_name: author_name.trim(),
      city: (await detectCity(this.req)).city,
      rating: parseInt(rating),
      comment: comment.trim(),
      app: _app.name || "",
      parent_id: this.document,
      approved: 0,
      helpful: 0,
      not_helpful: 0,
    });
 
    await doc.save();
 
    return this.success("Review submitted. It will appear once approved.");
  }
 
  async publicActionVoteReview() {
    const { review_id, vote } = this.body;
 
    if (!review_id) return this.error("review_id is required.");
    if (!["helpful", "not_helpful"].includes(vote)) return this.error("Invalid vote type.");
 
    const review = await loopar.db.getDoc("Review", { name: review_id, approved: 1 }, 
      ["name", vote, "not_helpful"]);
 
    if (!review) return this.error("Review not found.");
    await loopar.db.setValue("Review", vote, review[vote] + 1, review_id);
 
    return this.success("Vote registered.");
  }

  async publicActionLoadGalery(){
    const ref = loopar.getRef(this.document);

    if (this.hasData()) {
      loopar.session.set(this.document + '_page', this.data.page || 1);
    }

    const m = await loopar.newDocument("File Manager", {app: ref.__APP__});
    const files = await m.getList();

    return { rows: files.rows, pagination: files.pagination };
  }
}