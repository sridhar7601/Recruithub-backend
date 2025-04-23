/**
 * Represents a college with its basic details.
 * This interface is used to define the structure of a college entity
 * and is typically used for data transfer between the frontend and backend systems.
 */
export interface College {
  /**
   * The unique identifier for the college.
   * 
   * @type {string}
   * @format UUID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  collegeId?: string;

  /**
   * The name of the college.
   *
   * @type {string}
   * @requires This field is required.
   * @summary The length of the college name must be greater than 5
   * @example "Harvard University"
   */
  name: string;

  /**
   * The city where the college is located.
   *
   * @type {string}
   * @requires This field is required.
   * @example "Cambridge"
   */
  city: string;

  /**
   * Indicates whether the college has been soft deleted.
   * 
   * @type {boolean}
   * @default false
   */
  isDeleted?: boolean;

  /**
   * The timestamp when the college was created.
   * 
   * @type {Date}
   */
  createdTimestamp?: Date;

  /**
   * The timestamp when the college was last updated.
   * 
   * @type {Date}
   */
  updatedTimestamp?: Date;
}

/**
 * Enum for role types in a drive.
 */
export enum DriveRole {
  ASSOCIATE_ENGINEER = 'Associate Engineer',
  BUSINESS_ANALYST = 'Business Analyst'
}

/**
 * Enum for practice areas in a drive.
 */
export enum DrivePractice {
  APPLICATION_DEVELOPMENT = 'Application Development',
  DEVOPS = 'DevOps',
  PMO = 'PMO',
  BAUX = 'BaUX'
}

/**
 * Interface for a SPOC (Single Point of Contact) in a drive.
 */
export interface Spoc {
  /**
   * The unique identifier for the SPOC.
   * 
   * @type {string}
   * @format UUID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  spocId: string;

  /**
   * The email address of the SPOC.
   * 
   * @type {string}
   * @format email
   * @example "john.doe@example.com"
   */
  spocEmail: string;

  /**
   * The name of the SPOC.
   * 
   * @type {string}
   * @example "John Doe"
   */
  spocName: string;
}

/**
 * Represents a drive associated with a college.
 * Drives include details about roles, practices, and SPOCs.
 */
export interface Drive {
  /**
   * The unique identifier for the drive.
   * 
   * @type {string}
   * @format UUID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  driveId?: string;

  /**
   * The name of the drive.
   * 
   * @type {string}
   * @requires This field is required.
   * @example "Campus Recruitment Drive 2025"
   */
  name: string;

  /**
   * The unique identifier of the associated college.
   * 
   * @type {string}
   * @format UUID
   * @requires This field is required.
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  collegeId: string;

  /**
   * The name of the associated college.
   * 
   * @type {string}
   * @requires This field is required.
   * @example "Harvard University"
   */
  collegeName: string;

  /**
   * The role for the drive.
   * 
   * @type {string}
   * @enum {DriveRole}
   * @requires This field is required.
   * @example "Associate Engineer"
   */
  role: DriveRole;

  /**
   * The practice area for the drive.
   * 
   * @type {string}
   * @enum {DrivePractice}
   * @requires This field is required.
   * @example "Application Development"
   */
  practice: DrivePractice;

  /**
   * The unique identifier of the primary SPOC.
   * 
   * @type {string}
   * @format UUID
   * @requires This field is required.
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  primarySpocId: string;

  /**
   * The email address of the primary SPOC.
   * 
   * @type {string}
   * @format email
   * @requires This field is required.
   * @example "john.doe@example.com"
   */
  primarySpocEmail: string;

  /**
   * The name of the primary SPOC.
   * 
   * @type {string}
   * @requires This field is required.
   * @example "John Doe"
   */
  primarySpocName: string;

  /**
   * The secondary SPOC for the drive.
   * 
   * @type {Spoc}
   * @optional
   */
  secondarySpoc?: Spoc;

  /**
   * Indicates whether the drive is pinned.
   * 
   * @type {boolean}
   * @default false
   */
  isPinned?: boolean;

  /**
   * Indicates whether the drive is completed.
   * 
   * @type {boolean}
   * @default false
   */
  isCompleted?: boolean;

  /**
   * Indicates whether the drive is active.
   * 
   * @type {boolean}
   * @default true
   */
  isActive?: boolean;

  /**
   * The timestamp when the drive was created.
   * 
   * @type {Date}
   */
  createdTimestamp?: Date;

  /**
   * The timestamp when the drive was last updated.
   * 
   * @type {Date}
   */
  updatedTimestamp?: Date;
}
