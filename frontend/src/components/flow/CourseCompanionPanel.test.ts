import { describe, it, expect } from 'vitest'
import { getCourse, courses } from '../../content/cours'

describe('CourseCompanionPanel data contract', () => {
  it('retrieves valid course sections and expected DAG data', () => {
    const course = getCourse('classification-simple')
    expect(course).toBeDefined()
    expect(course?.sections.length).toBeGreaterThan(0)
    expect(course?.expected.nodes.length).toBeGreaterThan(0)
  })

  it('lists all registered courses with difficulty', () => {
    expect(courses.length).toBe(9)
    for (const c of courses) {
      expect(['facile', 'moyen', 'difficile']).toContain(c.difficulty)
    }
  })
})
