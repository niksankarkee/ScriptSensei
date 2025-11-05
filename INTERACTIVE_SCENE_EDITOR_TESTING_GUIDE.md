# Interactive Scene Editor - Testing Guide

**Date**: 2025-11-05
**Status**: Ready for Testing
**Completion**: 80% (Phases 1-4, 7 complete)

---

## 🧪 Testing Overview

This guide provides step-by-step instructions for testing the newly implemented Fliki-style interactive scene editor functionality.

---

## 🚀 Setup Instructions

### 1. Start the Frontend
```bash
cd frontend
npm run dev
```

Frontend should be running at: `http://localhost:3000`

### 2. Start the Backend Services
```bash
# Start video processing service
make start-video-service

# Or use Docker
docker-compose up video-processing-service
```

Backend should be running at: `http://localhost:8012`

### 3. Navigate to Video Details Page
```
http://localhost:3000/dashboard/videos/{video_id}
```

Replace `{video_id}` with an actual video ID from your database.

---

## ✅ Test Cases

### **Test 1: Left Sidebar Width**

**Expected Behavior**: Left sidebar should be wider (384px) than before

**Steps**:
1. Navigate to video details page
2. Observe left sidebar width

**✅ Pass Criteria**:
- Sidebar appears wider with more breathing room
- Content is not congested
- Scene cards are easy to read

---

### **Test 2: Scene Text Display**

**Expected Behavior**: Scene cards should show actual script content

**Steps**:
1. Expand a scene card (click chevron icon)
2. Look for "Scene Text:" section

**✅ Pass Criteria**:
- Actual scene text is displayed in a gray box
- Text is truncated with "line-clamp-3" if too long
- Not showing generic "Scene 1, Scene 2" labels

---

### **Test 3: Clickable Layers - Audio**

**Expected Behavior**: Clicking audio layer opens AudioPickerModal

**Steps**:
1. Expand a scene card
2. Click on "Audio" layer (should have pink hover border)
3. Observe modal opening

**✅ Pass Criteria**:
- AudioPickerModal opens
- Modal shows 4 tabs: Stock, My, Generate, Favorites
- Search bar is visible
- Music/Sound Effects radio buttons are present
- Audio grid displays sample audio

**Actions to Test**:
- Click "Music" radio button → Audio grid updates
- Click "Sound effects" radio button → Audio grid updates
- Type in search box → Audio grid filters
- Click on an audio card → Card gets pink border (selected)
- Click "Select" button → Modal closes, layer name updates, toast appears
- Click "Cancel" or X → Modal closes without changes

---

### **Test 4: Clickable Layers - Avatar**

**Expected Behavior**: Clicking avatar layer opens AvatarPickerModal

**Steps**:
1. Expand a scene card
2. Click on "Avatar" layer
3. Observe modal opening

**✅ Pass Criteria**:
- AvatarPickerModal opens
- Modal shows 3 tabs: Stock, My, Generate
- Gender filter dropdown is visible
- Avatar groups are displayed by name (Alyssa, Amy, Anita, Diana, etc.)

**Actions to Test**:
- Select "Female" in gender filter → Only female avatars show
- Select "Male" in gender filter → Only male avatars show
- Click on an avatar → Checkmark overlay appears
- Check "Apply to all scenes" → Checkbox is checked
- Click "Select" button → Modal closes, layer name updates, toast appears
- Click "Cancel" or X → Modal closes without changes

---

### **Test 5: Clickable Layers - Text**

**Expected Behavior**: Clicking text layer opens TextEditorModal

**Steps**:
1. Expand a scene card
2. Click on "Text" layer
3. Observe modal opening

**✅ Pass Criteria**:
- TextEditorModal opens with current scene text
- Formatting toolbar is visible
- Live preview area shows formatted text

**Actions to Test**:
- Change font family → Preview updates
- Change font size → Preview updates
- Click Bold button → Text becomes bold in preview
- Click Italic button → Text becomes italic in preview
- Click alignment buttons → Text alignment changes in preview
- Click color picker → Color picker opens
- Click a quick color → Text color changes in preview
- Select animation → Animation is selected
- Edit text in textarea → Text updates with formatting applied
- Click "Save Changes" → Modal closes, layer name updates, toast appears
- Click "Cancel" or X → Modal closes without changes

---

### **Test 6: Right Sidebar Tool Buttons**

**Expected Behavior**: Tool buttons open respective modals for current scene

**Steps**:
1. Select a scene (click on scene card header)
2. Observe right sidebar showing "Scene {number}"
3. Click on each tool button

**✅ Pass Criteria for Each Button**:

#### Audio Button:
- Clicks → AudioPickerModal opens for audio layer of current scene
- Pink hover effect works

#### Avatar Button:
- Clicks → AvatarPickerModal opens for avatar layer of current scene
- Pink hover effect works

#### Text Button:
- Clicks → TextEditorModal opens for text layer of current scene
- Pink hover effect works

#### Media Button:
- Clicks → Opens media modal (or shows "Coming Soon" if not integrated)
- Pink hover effect works

#### Shape Button:
- Clicks → Opens shape modal (or shows "Coming Soon" if not integrated)
- Pink hover effect works

#### Effects Button:
- Clicks → Shows "Coming Soon" toast
- Pink hover effect works

---

### **Test 7: Toast Notifications**

**Expected Behavior**: Toast notifications appear on successful actions

**Steps**:
1. Select audio → Observe toast
2. Select avatar → Observe toast
3. Save text changes → Observe toast
4. Click Effects button → Observe toast

**✅ Pass Criteria**:
- Toast appears in correct position (usually top-right)
- Toast shows correct title and description
- Toast auto-dismisses after a few seconds
- Toast is styled correctly (matches design)

---

### **Test 8: Layer Name Updates**

**Expected Behavior**: Layer names update after selection

**Steps**:
1. Note current layer name (e.g., "Audio")
2. Click layer → Select item from modal → Save
3. Observe layer name change

**✅ Pass Criteria**:
- Audio layer: Name changes to audio title (e.g., "Upbeat Corporate")
- Avatar layer: Name changes to avatar name (e.g., "Amy")
- Text layer: Name changes to truncated text (e.g., "Text: Lorem ipsum dolor...")

---

### **Test 9: Modal Close Behavior**

**Expected Behavior**: Modals close properly with all methods

**Steps for Each Modal**:
1. Open modal (click layer or tool button)
2. Try closing with:
   - X button in top-right
   - Cancel button in footer
   - Clicking outside modal (if implemented)
   - ESC key (if implemented)

**✅ Pass Criteria**:
- Modal closes without errors
- No state is changed if Cancel is clicked
- Modal state is properly reset
- Can re-open modal after closing

---

### **Test 10: Multiple Scenes**

**Expected Behavior**: Can interact with layers from different scenes

**Steps**:
1. Expand Scene 1 → Click audio layer → Select audio → Verify update
2. Expand Scene 2 → Click audio layer → Select different audio → Verify update
3. Switch between Scene 1 and Scene 2 → Verify correct audio shown

**✅ Pass Criteria**:
- Each scene maintains its own layer data
- Selecting audio for Scene 1 doesn't affect Scene 2
- Scene numbers are correctly displayed in modals and tool panel

---

### **Test 11: Hover Effects**

**Expected Behavior**: Visual feedback on hover

**Elements to Test**:
1. Scene layers in left sidebar → Pink border on hover
2. Tool buttons in right sidebar → Pink background on hover
3. Modal buttons (Select, Cancel) → Hover effects
4. Audio/Avatar cards → Border color change on hover

**✅ Pass Criteria**:
- All hover effects work smoothly
- Cursor changes to pointer on clickable elements
- Hover effects match Fliki design (pink color)

---

### **Test 12: Scene Expansion/Collapse**

**Expected Behavior**: Scene cards expand and collapse smoothly

**Steps**:
1. Click chevron icon on collapsed scene → Should expand
2. Click chevron icon on expanded scene → Should collapse
3. Expand multiple scenes at once

**✅ Pass Criteria**:
- Chevron icon rotates (right → down when expanded)
- Scene content (text + layers) appears/disappears
- Animation is smooth
- No layout jumping

---

## 🐛 Known Issues to Watch For

### Issue 1: Missing Audio/Avatar Layer
**Symptom**: Clicking tool button doesn't open modal
**Reason**: Scene might not have that layer type
**Solution**: Currently showing console log; should gracefully handle by creating layer

### Issue 2: Layer Name Not Updating
**Symptom**: After selection, layer name stays the same
**Reason**: State update might not be propagating
**Debug**: Check console for errors, verify `setScenes` is called

### Issue 3: Modal Doesn't Close
**Symptom**: Modal stays open after clicking Select
**Reason**: `setActiveModal` might not be called
**Debug**: Check handler functions, verify `onClose` is called

### Issue 4: Toast Not Appearing
**Symptom**: No notification after selection
**Reason**: `toast` function might not be initialized
**Debug**: Check `useToast` hook, verify toast provider is in layout

---

## 📊 Test Results Template

Use this template to record test results:

```markdown
## Test Results - [Date]

### Tester: [Your Name]
### Browser: [Chrome/Firefox/Safari]
### OS: [macOS/Windows/Linux]

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1: Left Sidebar Width | ✅ Pass | Sidebar looks good |
| Test 2: Scene Text Display | ✅ Pass | Text shows correctly |
| Test 3: Audio Modal | ✅ Pass | All features work |
| Test 4: Avatar Modal | ⚠️ Partial | Gender filter not working |
| Test 5: Text Modal | ❌ Fail | Preview not updating |
| Test 6: Tool Buttons | ✅ Pass | All buttons functional |
| Test 7: Toast Notifications | ✅ Pass | Toasts appear correctly |
| Test 8: Layer Name Updates | ✅ Pass | Names update as expected |
| Test 9: Modal Close | ✅ Pass | All close methods work |
| Test 10: Multiple Scenes | ✅ Pass | Scenes independent |
| Test 11: Hover Effects | ✅ Pass | All hover effects work |
| Test 12: Scene Expansion | ✅ Pass | Smooth animation |

### Bugs Found:
1. [Description of bug]
2. [Description of bug]

### Suggestions:
1. [Improvement suggestion]
2. [Improvement suggestion]
```

---

## 🔍 Console Debugging

### Useful Console Logs to Check:

```javascript
// In browser console, check:
console.log('Active Modal:', activeModal)
console.log('Selected Scene:', selectedScene)
console.log('Scenes:', scenes)
```

### Check for Errors:
- Open browser DevTools (F12)
- Go to Console tab
- Look for red error messages
- Check Network tab for failed API calls

---

## 📸 Screenshot Checklist

Take screenshots of:
1. ✅ Left sidebar showing wider layout
2. ✅ Scene text display in expanded card
3. ✅ AudioPickerModal open with audio grid
4. ✅ AvatarPickerModal open with avatar grid
5. ✅ TextEditorModal open with toolbar
6. ✅ Right sidebar tool buttons with hover effect
7. ✅ Toast notification appearing
8. ✅ Layer name after update
9. ✅ Multiple modals (before/after selection)

---

## ✅ Acceptance Criteria

**Phase 1-4 & 7 Complete When**:
- [ ] All 12 test cases pass
- [ ] No critical bugs found
- [ ] UI matches Fliki design
- [ ] All interactions are smooth
- [ ] Toast notifications work
- [ ] Layer names update correctly
- [ ] Modals open/close properly
- [ ] Hover effects work throughout

---

## 🚀 Next Steps After Testing

### If All Tests Pass:
1. Move to Phase 5 (Canvas Manipulation) or Phase 6 (Backend APIs)
2. Document any minor issues for future improvement
3. Create video demo of functionality
4. Update user documentation

### If Tests Fail:
1. Document specific failures
2. Create bug tickets with reproduction steps
3. Fix critical issues first
4. Re-test after fixes

---

**Good luck with testing!** 🎉

If you find any issues, refer to the implementation documentation at:
- `FLIKI_INTERACTIVE_SCENE_EDITOR_IMPLEMENTATION.md`
- `FLIKI_SCENE_EDITOR_PHASE_1-4_7_COMPLETE.md`
