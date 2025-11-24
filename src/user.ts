/**
 * @fileoverview This file contains the User class for storing user profile data.
 */

import * as fs from 'fs';
import * as path from 'path';

export class User {
  constructor(
    public username: string,
    public age?: number,
    public height?: number, // in cm
    public weight?: number, // in kg
    public run1hResult?: number, // in km
    public cyclingFtp?: number, // in watts
    public swim100mTime?: number // in seconds
  ) {}

  /**
   * Saves the current user's profile to a JSON file.
   */
  save(): void {
    const dir = path.join('data', 'users');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dataFilePath = path.join(dir, `${this.username}.json`);
    const json = JSON.stringify(this, null, 2);
    fs.writeFileSync(dataFilePath, json);
  }

  /**
   * Loads a user's profile from a JSON file.
   * @param username The username to load.
   * @returns The loaded User instance, or null if not found.
   */
  static load(username: string): User | null {
    const dataFilePath = path.join('data', 'users', `${username}.json`);
    try {
      if (!fs.existsSync(dataFilePath)) {
        return null;
      }
      const json = fs.readFileSync(dataFilePath, 'utf-8');
      const data = JSON.parse(json);
      return new User(
        data.username, data.age, data.height, data.weight,
        data.run1hResult, data.cyclingFtp, data.swim100mTime
      );
    } catch (error) {
      console.error(`Error loading user profile for ${username}:`, error);
      return null;
    }
  }
}