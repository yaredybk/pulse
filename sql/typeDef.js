/** Type definitions for database tables
 * GENERATED BY MICROSOFT COPILOT from schema definitions "init.sql"
 * !!! NOT VERIFIED !!!
 */
// User
/**
@typedef {Object} User
@property {number} iduser - Primary key.
@property {string} uuid - Unique identifier.
@property {string} name - User’s name.
@property {(‘M’|‘F’)} [gender] - User’s gender.
@property {string} [birth] - User’s birth date.
@property {string} [country] - User’s country.
@property {string} [city] - User’s city.
@property {string} [phone] - User’s phone number.
@property {string} [email] - User’s email address.
@property {string} [uname] - User’s username.
@property {number} [idpass] - Foreign key to passwords table.
@property {string} [bio] - User’s bio.
@property {string} [profile] - User’s profile picture URL.
@property {number} [active] - User’s active status.
@property {string} created_at - Timestamp of creation.
@property {string} updated_at - Timestamp of last update.
@property {Object} [info] - Additional user information. */

// Password
/**
@typedef {Object} Password
@property {number} idpass - Primary key.
@property {string} pass - Password.
@property {string} updated_at - Timestamp of last update. */

// Chat
/**
@typedef {Object} Chat
@property {number} idchat - Primary key.
@property {number} iduser1 - User 1 ID.
@property {number} [iduser2] - User 2 ID.
@property {string} created_at - Timestamp of creation.
@property {string} updated_at - Timestamp of last update. */

// ChatText
/**
@typedef {Object} ChatText
@property {number} idchat_text - Primary key.
@property {number} idchat - Foreign key to chats table.
@property {string} content - Chat content.
@property {number} sender - Sender’s user ID.
@property {string} created_at - Timestamp of creation.
@property {string} updated_at - Timestamp of last update. */

// Room
/**
@typedef {Object} Room
@property {number} idroom - Primary key.
@property {string} uuid - Unique identifier.
@property {string} name - Room name.
@property {string} rname - Unique room name.
@property {number} admin - Admin user ID.
@property {string} [bio] - Room bio.
@property {string} [profile] - Room profile picture URL.
@property {number} [active] - Room active status.
@property {string} created_at - Timestamp of creation.
@property {string} updated_at - Timestamp of last update. */

// Member
/**
@typedef {Object} Member
@property {number} idroom - Room ID.
@property {number} iduser - User ID.
@property {string} created_at - Timestamp of creation. */

// RoomText
/**
@typedef {Object} RoomText
@property {number} idroom_text - Primary key.
@property {number} idroom - Foreign key to room table.
@property {string} content - Room text content.
@property {number} sender - Sender’s user ID.
@property {string} created_at - Timestamp of creation.
@property {string} updated_at - Timestamp of last update. */
module.exports = {};
