import sqlite3

conn = sqlite3.connect('aspes_dev.db')

with open('db_snapshot.txt', 'w', encoding='utf-8') as f:
    f.write('===== USERS =====\n')
    for r in conn.execute('SELECT email, role, full_name FROM users').fetchall():
        f.write(f'  {r[1]:12} | {r[2]:30} | {r[0]}\n')

    f.write('\n===== PROJECTS =====\n')
    for r in conn.execute('SELECT title, status, course_name, batch_year FROM projects').fetchall():
        f.write(f'  [{r[1]:20}] {r[0]}\n')
        f.write(f'               Course: {r[2]}  Batch: {r[3]}\n')

    f.write('\n===== EVALUATIONS =====\n')
    rows = conn.execute('''
        SELECT e.total_score, e.code_quality_score, e.documentation_score,
               e.plagiarism_score, e.report_alignment_score, e.ai_code_score,
               e.status, e.ai_code_detected, e.plagiarism_detected, p.title
        FROM evaluations e JOIN projects p ON e.project_id = p.id
    ''').fetchall()

    def grade(s):
        s = s or 0
        if s >= 97: return 'A+'
        if s >= 93: return 'A'
        if s >= 90: return 'A-'
        if s >= 87: return 'B+'
        if s >= 83: return 'B'
        if s >= 80: return 'B-'
        if s >= 77: return 'C+'
        if s >= 73: return 'C'
        if s >= 70: return 'C-'
        if s >= 63: return 'D'
        return 'F'

    for r in rows:
        f.write(f'\n  Project  : {r[9]}\n')
        f.write(f'  Score    : {r[0]:.2f}/100  ({r[6]})  Grade: {grade(r[0])}\n')
        f.write(f'  Breakdown: Code={r[1]:.1f}  Doc={r[2]:.1f}  PlagOrig={r[3]:.1f}  Align={r[4]:.1f}  AIAuth={r[5]:.1f}\n')
        f.write(f'  Flags    : AI_detected={bool(r[7])}  Plagiarism={bool(r[8])}\n')

    scores = [r[0] for r in conn.execute(
        'SELECT total_score FROM evaluations WHERE total_score IS NOT NULL'
    ).fetchall()]

    u_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    p_count = conn.execute('SELECT COUNT(*) FROM projects').fetchone()[0]
    e_count = conn.execute('SELECT COUNT(*) FROM evaluations').fetchone()[0]

    f.write('\n===== SUMMARY =====\n')
    f.write(f'  Total Users       : {u_count}\n')
    f.write(f'  Total Projects    : {p_count}\n')
    f.write(f'  Total Evaluations : {e_count}\n')
    if scores:
        f.write(f'  Avg Score         : {sum(scores)/len(scores):.2f}/100\n')
        f.write(f'  Highest Score     : {max(scores):.2f}/100\n')
        f.write(f'  Lowest Score      : {min(scores):.2f}/100\n')

print('Done - written to db_snapshot.txt')
