const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  createProject,
  getProjects,
  getPendingProjects,
  getProjectById,
  updateProject,
  submitProject,
  approveProject,
  rejectProject,
  deleteProject
} = require('../controllers/orgProjectsController')

// Nested project sub-resources (phases, team, contracts, risks, …)
const orgProjectNestedRoutes = require('./orgProjectNested')

// ============ MIDDLEWARES ============

// Upper Mgmt + Super Admin (للعمليات الحساسة: اعتماد، رفض، حذف)
const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]

// أي عضو في الجهة (للقراءة + الإنشاء + التعديل)
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

// ============ PROJECTS ROUTES ============

// إنشاء مشروع — Data Entry + Upper Mgmt
router.post('/', ...isOrgAny, createProject)

// عرض كل المشاريع — أي عضو
router.get('/', ...isOrgAny, getProjects)

// عرض المشاريع المعلّقة — Upper Mgmt فقط
router.get('/pending', ...isUpperMgmt, getPendingProjects)

router.post('/:id/submit', ...isOrgAny, submitProject)

// Nested resources BEFORE /:id so they are not captured as project ids
router.use(orgProjectNestedRoutes)

// عرض مشروع واحد — أي عضو
router.get('/:id', ...isOrgAny, getProjectById)

// تحديث مشروع — Data Entry + Upper Mgmt (مع منطق الصلاحيات داخل الـ controller)
router.put('/:id', ...isOrgAny, updateProject)

// اعتماد مشروع — Upper Mgmt فقط
router.patch('/:id/approve', ...isUpperMgmt, approveProject)

router.patch('/:id/reject', ...isUpperMgmt, rejectProject)

// حذف مشروع — Upper Mgmt فقط
router.delete('/:id', ...isUpperMgmt, deleteProject)

module.exports = router
