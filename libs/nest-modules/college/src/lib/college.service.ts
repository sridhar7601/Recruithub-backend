import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { College } from './college.schema';
import { Model } from 'mongoose';
import { 
  CollegeResponseDto, 
  CreateCollegeDto, 
  PaginatedCollegeResponseDto, 
  UpdateCollegeDto 
} from './dto';

/**
 * This service provides methods to interact with the `College` collection.
 */
@Injectable()
export class CollegeService {
  constructor(@InjectModel(College.name) private model: Model<College>) {}

  /**
   * Creates a new college document in the database.
   *
   * @param {CreateCollegeDto} dto - The data transfer object containing the details of the college to be created.
   * @returns {Promise<CollegeResponseDto>} A promise that resolves to the created `College` document.
   */
  async createCollege(dto: CreateCollegeDto): Promise<CollegeResponseDto> {
    const college = new this.model(dto);
    const savedCollege = await college.save();
    const collegeData = savedCollege.toJSON() as any;
    
    return {
      collegeId: collegeData.collegeId,
      name: collegeData.name,
      city: collegeData.city,
      isDeleted: collegeData.isDeleted,
      createdTimestamp: collegeData.createdAt || new Date(),
      updatedTimestamp: collegeData.updatedAt || new Date()
    };
  }

  /**
   * Retrieves a paginated list of non-deleted college documents from the database.
   *
   * @param {number} page - The page number (1-based).
   * @param {number} limit - The number of items per page.
   * @param {object} filters - Optional filters to apply.
   * @returns {Promise<PaginatedCollegeResponseDto>} A promise that resolves to a paginated response of college documents.
   */
  async getColleges(
    page: number,
    limit: number,
    filters: { city?: string }
  ): Promise<PaginatedCollegeResponseDto> {
    // Build query
    const query: any = { isDeleted: false };
    
    // Apply filters if provided
    if (filters.city) {
      query.city = filters.city;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [colleges, totalItems] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec()
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);
    
    // Map to response DTOs
    const items = colleges.map(college => {
      const collegeData = college.toJSON() as any;
      return {
        collegeId: collegeData.collegeId,
        name: collegeData.name,
        city: collegeData.city,
        isDeleted: collegeData.isDeleted,
        createdTimestamp: collegeData.createdAt || new Date(),
        updatedTimestamp: collegeData.updatedAt || new Date()
      };
    });
    
    // Return paginated response
    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages
      }
    };
  }

  /**
   * Retrieves a single non-deleted college document by ID.
   *
   * @param {string} collegeId - The ID of the college to retrieve.
   * @returns {Promise<CollegeResponseDto | null>} A promise that resolves to the college document or null if not found.
   */
  async getCollege(collegeId: string): Promise<CollegeResponseDto | null> {
    const college = await this.model.findOne({ 
      collegeId, 
      isDeleted: false 
    }).exec();
    
    if (!college) {
      return null;
    }
    
    const collegeData = college.toJSON() as any;
    return {
      collegeId: collegeData.collegeId,
      name: collegeData.name,
      city: collegeData.city,
      isDeleted: collegeData.isDeleted,
      createdTimestamp: collegeData.createdAt || new Date(),
      updatedTimestamp: collegeData.updatedAt || new Date()
    };
  }

  /**
   * Updates a college document by ID.
   *
   * @param {string} collegeId - The ID of the college to update.
   * @param {UpdateCollegeDto} dto - The data to update.
   * @returns {Promise<CollegeResponseDto | null>} A promise that resolves to the updated college document or null if not found.
   */
  async updateCollege(
    collegeId: string,
    dto: UpdateCollegeDto
  ): Promise<CollegeResponseDto | null> {
    const college = await this.model.findOneAndUpdate(
      { collegeId, isDeleted: false },
      { $set: dto },
      { new: true }
    ).exec();
    
    if (!college) {
      return null;
    }
    
    const collegeData = college.toJSON() as any;
    return {
      collegeId: collegeData.collegeId,
      name: collegeData.name,
      city: collegeData.city,
      isDeleted: collegeData.isDeleted,
      createdTimestamp: collegeData.createdAt || new Date(),
      updatedTimestamp: collegeData.updatedAt || new Date()
    };
  }

  /**
   * Soft deletes a college document by ID.
   *
   * @param {string} collegeId - The ID of the college to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the college was deleted, false otherwise.
   */
  async deleteCollege(collegeId: string): Promise<boolean> {
    const result = await this.model.findOneAndUpdate(
      { collegeId, isDeleted: false },
      { $set: { isDeleted: true } }
    ).exec();
    
    return !!result;
  }

  /**
   * Retrieves all college documents from the database.
   * @deprecated Use getColleges instead
   * @returns {Promise<College[]>} A promise that resolves to an array of `College` documents.
   */
  async getAllCollege(): Promise<College[]> {
    return this.model.find({ isDeleted: false }).exec();
  }
}
