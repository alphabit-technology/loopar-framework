'use strict'

import { loopar, fileManage, BaseController } from "loopar";

export default class ApiController extends BaseController {
  async publicActionList() {

    const { app, page_id, limit = 6, offset = 0 } = this.query;
 
    const filter = { approved: 1 };
    if (app)     filter.app     = app;
    if (page_id) filter.page_id = page_id;
 
    const reviews = await loopar.db.getList("Review", {
      filter,
      fields:   ["name", "author_name", "city", "rating", "comment", "creation", "helpful", "not_helpful"],
      orderBy:  "creation desc",
      limit:    parseInt(limit),
      offset:   parseInt(offset),
    });
 
    return reviews
  }

  async publicActionSubmit() {
    const { author_name, city, rating, comment, app, page_id } = this.body;
 
    if (!author_name?.trim()) return this.error("Author name is required.");
    if (!comment?.trim())     return this.error("Comment is required.");
    if (rating < 1 || rating > 5) return this.error("Rating must be between 1 and 5.");
 
    const doc = await loopar.newDocument("Review", {
      name:        loopar.utils.randomString(15),
      author_name: author_name.trim(),
      city:        (await detectCity(this.req)).city,
      rating:      parseInt(rating),
      comment:     comment.trim(),
      app:         app || "",
      page_id:     page_id || "",
      approved:    0,
      helpful:     0,
      not_helpful: 0,
    });
 
    await doc.save();
 
    return this.success("Review submitted. It will appear once approved.");
  }
 
  async publicActionVote() {
    const { review_id, vote } = this.body;
 
    if (!review_id)                              return this.error("review_id is required.");
    if (!["helpful", "not_helpful"].includes(vote)) return this.error("Invalid vote type.");
 
    const review = await loopar.db.getDoc("Review", { name: review_id, approved: 1 }, 
      ["name", vote, "not_helpful"]);
 
    if (!review) return this.error("Review not found.");
    await loopar.db.setValue("Review", vote, review[vote] + 1, review_id);
 
    return this.success("Vote registered.");
  }
}