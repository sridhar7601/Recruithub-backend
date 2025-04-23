import { Injectable } from '@nestjs/common';
import { 
  Domain, 
  LANGUAGE_DOMAIN_MAPPING, 
  JS_FRAMEWORKS,
  PYTHON_FRAMEWORKS,
  JAVA_FRAMEWORKS,
  DATABASE_TECHNOLOGIES,
  CLOUD_TECHNOLOGIES,
  TECHNOLOGY_CATEGORIES,
  TechnologyCategory 
} from '../constants/domain.constants';
import { DomainCount } from '../interfaces/github.interfaces';

@Injectable()
export class DomainService {
  /**
   * Map technologies to domains with improved categorization
   * @param technologies List of technologies
   * @returns Domain count record
   */
  mapTechnologiesToDomains(technologies: string[]): DomainCount {
    const domainTechnologies: DomainCount = {};
    const techCategories = new Map<TechnologyCategory, string[]>();
    
    if (!technologies || technologies.length === 0) {
      return domainTechnologies;
    }

    // First pass: Categorize technologies
    for (const technology of technologies) {
      const upperTech = technology.toUpperCase();
      const category = TECHNOLOGY_CATEGORIES[upperTech];
      
      if (category) {
        const categoryTechs = techCategories.get(category) || [];
        categoryTechs.push(upperTech);
        techCategories.set(category, categoryTechs);
      }
    }

    // Second pass: Map to domains with improved logic
    for (const technology of technologies) {
      const upperTech = technology.toUpperCase();
      let domain = LANGUAGE_DOMAIN_MAPPING[upperTech] as string;

      // Special handling for full-stack detection
      if (!domain) {
        domain = this.detectDomain(upperTech, techCategories);
      }

      if (!domain) {
        domain = Domain.OTHERS;
      }

      if (domain in domainTechnologies) {
        domainTechnologies[domain] += `,${technology}`;
      } else {
        domainTechnologies[domain] = technology;
      }
    }

    // Post-process: Check for full-stack combinations
    this.detectFullStackCombinations(domainTechnologies, techCategories);

    return this.sortDomainDictionary(domainTechnologies);
  }

  /**
   * Detect domain based on technology and its context
   * @param technology Technology to analyze
   * @param techCategories Map of technology categories
   * @returns Detected domain
   */
  private detectDomain(technology: string, techCategories: Map<TechnologyCategory, string[]>): string | null {
    // Check frameworks
    if (JS_FRAMEWORKS.includes(technology)) {
      return technology === 'NODE' || technology === 'EXPRESS' ? Domain.BACKEND : Domain.FRONTEND;
    }

    if (PYTHON_FRAMEWORKS.includes(technology)) {
      return ['PANDAS', 'NUMPY', 'SCIPY', 'SCIKIT', 'TENSORFLOW', 'PYTORCH'].includes(technology)
        ? Domain.DATA
        : Domain.BACKEND;
    }

    if (JAVA_FRAMEWORKS.includes(technology)) {
      return Domain.BACKEND;
    }

    // Check databases
    if (DATABASE_TECHNOLOGIES.includes(technology)) {
      return Domain.BACKEND;
    }

    // Check cloud
    if (CLOUD_TECHNOLOGIES.includes(technology)) {
      return Domain.DEVOPS;
    }

    return null;
  }

  /**
   * Detect and handle full-stack combinations
   * @param domainTechnologies Current domain mapping
   * @param techCategories Technology categories
   */
  private detectFullStackCombinations(
    domainTechnologies: DomainCount,
    techCategories: Map<TechnologyCategory, string[]>
  ): void {
    const hasFramework = techCategories.has(TechnologyCategory.FRAMEWORK);
    const hasDatabase = techCategories.has(TechnologyCategory.DATABASE);
    const hasFrontend = Domain.FRONTEND in domainTechnologies;
    const hasBackend = Domain.BACKEND in domainTechnologies;

    // If developer has both frontend and backend technologies
    if (hasFrontend && hasBackend && (hasFramework || hasDatabase)) {
      const fullStackTechs = [
        domainTechnologies[Domain.FRONTEND],
        domainTechnologies[Domain.BACKEND]
      ].join(',');

      domainTechnologies[Domain.FULL_STACK] = fullStackTechs;
    }
  }

  /**
   * Sort domain dictionary by number of technologies
   * @param domainTechnologies Domain count record
   * @returns Sorted domain count record
   */
  private sortDomainDictionary(domainTechnologies: DomainCount): DomainCount {
    const entries = Object.entries(domainTechnologies).sort(
      (a, b) => b[1].split(',').length - a[1].split(',').length,
    );

    // Move "OTHERS" domain to the end
    const indexToMove = entries.findIndex(([key]) => key === Domain.OTHERS);
    if (indexToMove !== -1) {
      const [removed] = entries.splice(indexToMove, 1);
      entries.push(removed);
    }

    return Object.fromEntries(entries);
  }
}
