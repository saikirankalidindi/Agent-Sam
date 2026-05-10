/**
 * Checkpoint smoke test — verifies the test infrastructure is wired correctly.
 * This file ensures `npx vitest --run` exits 0 before any feature tests are added.
 */

describe('Test infrastructure', () => {
  it('jest-dom matchers are available', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(el).toBeInTheDocument()
    document.body.removeChild(el)
  })

  it('globals (describe / it / expect) are available', () => {
    expect(true).toBe(true)
  })
})
