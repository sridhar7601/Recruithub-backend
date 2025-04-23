import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Student } from '../student.schema';
import { WecpMCQQuestion, WecpProgrammingQuestion } from '../interfaces/wecp.interface';

@Injectable()
export class StudentExportService {
  async exportToExcel(students: Student[]): Promise<Buffer> {
    // Get maximum number of programming questions across all students
    let maxProgrammingQuestions = 0;
    students.forEach(student => {
      const questionWiseScore = student.wecpData?.raw?.questionWiseScore || {};
      const programmingQuestions = Object.values(questionWiseScore)
        .filter((q): q is WecpProgrammingQuestion => 
          typeof q === 'object' && q !== null && 'testcasesPassed' in q
        )
        .sort((a, b) => (b.maxScore || 0) - (a.maxScore || 0));
      maxProgrammingQuestions = Math.max(maxProgrammingQuestions, programmingQuestions.length);
    });

    const headers = this.getHeaders(maxProgrammingQuestions);
    const rows = this.transformStudentsToRows(students, maxProgrammingQuestions);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Apply styles
    this.applyColumnWidths(ws, maxProgrammingQuestions);
    this.applyHeaderStyles(ws, headers);
    this.applyProgrammingStyles(ws, rows.length, maxProgrammingQuestions);
    this.applyScoreAndViolationStyles(ws, rows.length);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Generate buffer with style options
    return XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
      compression: true
    });
  }

  private getHeaders(maxProgrammingQuestions: number): string[] {
    const programmingHeaders = Array.from(
      { length: maxProgrammingQuestions }, 
      (_, i) => `Programming Q${i + 1} Details`
    );

    return [
      // Basic Info
      'Registration Number', 'Name', 'Email', 'Phone', 'Department', 'Degree',
      // Academic Details
      '10th Marks', '12th Marks', 'UG Marks', 'PG Marks',
      // Evaluation Scores & Report
      'GitHub Score', 'Resume Score', 'AI Score', 'WeCP Report',
      // WeCP Test Information
      'WeCP Overall Score',
      'Test Start Time', 'Test Duration', 'Total Time Taken',
      // Violation Details
      'Paste Content Violations',
      'Full Screen Violations', 
      'Screen Share Violations',
      'Multiple Faces Violations',
      'Tab Change Violations',
      'Copy Content Violations',
      'No Face Violations',
      'Screen Extended Violations',
      'MCQ Score (Gained/Total)', 'MCQ Time & Accuracy',
      ...programmingHeaders.map(h => 
        h.replace('Details', `\nScore | Time | Language | Tests | Attempts`)),
      // Profile Links
      'GitHub Profile', 'GitHub Domains', 'GitHub Technologies',
      'LinkedIn Profile', 'Resume URL'
    ];
  }

  private transformStudentsToRows(students: Student[], maxProgrammingQuestions: number): any[][] {
    return students.map(student => {
      // Parse GitHub domains
      let domains = '';
      try {
        const domainsObj = JSON.parse(student.githubDetails?.domains || '{}');
        domains = Object.keys(domainsObj)
          .filter(key => domainsObj[key])
          .join(', ');
      } catch (e) {
        domains = 'Error parsing domains';
      }

      // Process WeCP data
      const wecpData = student.wecpData?.raw;
      const questionWiseScore = wecpData?.questionWiseScore || {};

      // Calculate total test time
      const startTime = wecpData?.testStartTime ? new Date(wecpData.testStartTime) : null;
      const finishTime = wecpData?.finishTime ? new Date(wecpData.finishTime) : null;
      const totalTestTime = startTime && finishTime ? 
        Math.round((finishTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

      // Get violation data
      const proctoringData = wecpData?.raw?.proctoringData || {};
      const violationData = [
        proctoringData.pasteContent || 0,
        proctoringData.fullScreenViolation || 0,
        proctoringData.screenShareStopped || 0,
        proctoringData.multipleFaces || 0,
        proctoringData.tabChanged || 0,
        proctoringData.copyContent || 0,
        proctoringData.noFaceDetected || 0,
        proctoringData.screenExtended || 0
      ];

      // Find programming questions
      const programmingQuestions = Object.values(questionWiseScore)
        .filter((q): q is WecpProgrammingQuestion => 
          typeof q === 'object' && q !== null && 'testcasesPassed' in q
        )
        .sort((a, b) => (b.maxScore || 0) - (a.maxScore || 0));

      // Calculate MCQ scores
      const mcqQuestions = Object.values(questionWiseScore)
        .filter((q): q is WecpMCQQuestion => {
          const question = q as { type?: string };
          return typeof q === 'object' && 
                 q !== null && 
                 !('testcasesPassed' in q) && 
                 question.type === 'answer';
        });
      const mcqTotal = mcqQuestions.reduce((sum, q) => sum + (q.maxScore || 0), 0);
      const mcqGained = mcqQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
      const mcqTimeTotal = mcqQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);

      // Format programming question details
      const formatProgrammingDetails = (q: WecpProgrammingQuestion | undefined) => {
        if (!q) return 'Not Attempted';
        
        const timeSpent = Math.round(q.timeSpent / 1000 / 60); // Convert to minutes
        return [
          `${q.score || 0}/${q.maxScore || 0}`,
          `${timeSpent}m`,
          q.language || 'N/A',
          `${q.testcasesPassed || 0}/${q.maxScore || 0}`,
          q.totalAttempts || 0
        ].join(' | ');
      };

      // Generate programming details for all possible questions
      const programmingDetails = Array.from({ length: maxProgrammingQuestions }, (_, i) => 
        formatProgrammingDetails(programmingQuestions[i])
      );

      return [
        student.registrationNumber,
        student.name,
        student.emailId,
        student.phoneNumber,
        student.department,
        student.degree,
        student.academicDetails?.tenthMarks,
        student.academicDetails?.twelfthMarks,
        student.academicDetails?.ugMarks,
        student.academicDetails?.pgMarks,
        // Evaluation Scores & Report
        student.githubDetails?.totalScore,
        student.resumeScore?.totalScore,
        student.aiScore?.total,
        student.wecpData?.reportLink || '',
        // WeCP Test Information
        student.wecpTestScore,
        startTime ? startTime.toLocaleString() : 'N/A',
        wecpData?.testDuration || 'N/A',
        `${totalTestTime}m`,
        ...violationData,
        `${mcqGained}/${mcqTotal}`,
        `${mcqQuestions.filter(q => q.status).length}/${mcqQuestions.length} | ${Math.round(mcqTimeTotal/1000/60)}m`,
        ...programmingDetails,
        // Profile Links
        student.githubProfile,
        domains,
        student.githubDetails?.technologies || '',
        student.linkedInProfile,
        student.resumeUrl
      ];
    });
  }

  private applyColumnWidths(ws: XLSX.WorkSheet, maxProgrammingQuestions: number): void {
    const baseColWidths = [
      { wch: 20 },  // Registration Number
      { wch: 25 },  // Name
      { wch: 30 },  // Email
      { wch: 15 },  // Phone
      { wch: 15 },  // Department
      { wch: 20 },  // Degree
      { wch: 10 },  // 10th Marks
      { wch: 10 },  // 12th Marks
      { wch: 10 },  // UG Marks
      { wch: 10 },  // PG Marks
      // Evaluation Scores & Report
      { wch: 15 },   // GitHub Score
      { wch: 15 },   // Resume Score
      { wch: 15 },   // AI Score
      { wch: 35 },  // WeCP Report
      // WeCP Test Information
      { wch: 15 },  // WeCP Overall Score
      { wch: 20 },  // Test Start Time
      { wch: 15 },  // Test Duration
      { wch: 12 },  // Total Time Taken
      // Violation columns
      { wch: 15 },  // Paste Content
      { wch: 15 },  // Full Screen
      { wch: 15 },  // Screen Share
      { wch: 15 },  // Multiple Faces
      { wch: 15 },  // Tab Change
      { wch: 15 },  // Copy Content
      { wch: 15 },  // No Face
      { wch: 15 },  // Screen Extended
      { wch: 15 },  // MCQ Score
      { wch: 20 },  // MCQ Time & Accuracy
    ];

    // Add widths for programming questions
    const programmingColWidths = Array.from(
      { length: maxProgrammingQuestions },
      () => ({ wch: 55 }) // Width for each programming question column
    );

    // Add remaining column widths
    const remainingColWidths = [
      { wch: 40 },  // GitHub Profile
      { wch: 30 },  // GitHub Domains
      { wch: 40 },  // GitHub Technologies
      { wch: 40 },  // LinkedIn Profile
      { wch: 40 }   // Resume URL
    ];

    ws['!cols'] = [
      ...baseColWidths,
      ...programmingColWidths,
      ...remainingColWidths
    ];
  }

  private applyHeaderStyles(ws: XLSX.WorkSheet, headers: string[]): void {
    const headerStyle = {
      fill: { 
        type: 'pattern',
        patternType: 'solid',
        fgColor: { rgb: "4F81BD" }
      },
      font: { 
        bold: true, 
        color: { rgb: "FFFFFF" },
        name: 'Arial',
        sz: 11
      },
      alignment: { 
        horizontal: "center",
        vertical: "center",
        wrapText: true
      },
      border: {
        top: { style: 'thin', color: { rgb: "000000" } },
        bottom: { style: 'thin', color: { rgb: "000000" } },
        left: { style: 'thin', color: { rgb: "000000" } },
        right: { style: 'thin', color: { rgb: "000000" } }
      }
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      ws[address] = {
        v: headers[C],  // value
        t: 's',        // type: string
        s: headerStyle  // style
      };
    }
  }

  private applyProgrammingStyles(ws: XLSX.WorkSheet, rowCount: number, maxProgrammingQuestions: number): void {
    const programmingStartIndex = 27; // Index where programming questions start (after violation columns)
    for (let row = 1; row <= rowCount; row++) {
      for (let i = 0; i < maxProgrammingQuestions; i++) {
        const col = programmingStartIndex + i;
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[address]) continue;
        
        ws[address].s = {
          alignment: {
            wrapText: true,
            vertical: 'top'
          },
          font: {
            name: 'Arial',
            sz: 10
          }
        };
      }
    }
  }

  private applyScoreAndViolationStyles(ws: XLSX.WorkSheet, rowCount: number): void {
    const scoreColumns = [10, 11, 12, 14]; // GitHub, Resume, AI, WeCP Overall Score
    const violationColumns = [18, 19, 20, 21, 22, 23, 24, 25]; // Violation columns

    for (let row = 1; row <= rowCount; row++) {
      // Format violation columns
      for (const col of violationColumns) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[address]) continue;

        const violations = parseInt(ws[address].v);
        if (!isNaN(violations)) {
          ws[address].s = {
            fill: {
              type: 'pattern',
              patternType: 'solid',
              fgColor: { 
                rgb: violations > 0 ? "FF7B7B" : "92D050" // Red for violations, green for no violations
              }
            },
            font: { 
              bold: false,
              name: 'Arial',
              sz: 11
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
      }

      // Format score columns
      for (const col of scoreColumns) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[address]) continue;

        // Number format with 2 decimal places for score columns
        ws[address].z = '0.00';
        
        const score = parseFloat(ws[address].v);
        if (!isNaN(score)) {
          ws[address].s = {
            fill: {
              type: 'pattern',
              patternType: 'solid',
              fgColor: { 
                rgb: score >= 50 ? "92D050" :  // Green for high scores (>=50)
                      score >= 30 ? "FFEB84" :  // Yellow for medium scores (30-49)
                      "FF7B7B"                  // Red for low scores (<30)
              }
            },
            font: { 
              bold: false,
              name: 'Arial',
              sz: 11
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
      }
    }
  }
}
