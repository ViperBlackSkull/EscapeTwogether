# EscapeTwogether - Troubleshooting Guide

This guide helps resolve common issues with EscapeTwogether.

## Table of Contents

- [Connection Issues](#connection-issues)
- [Performance Problems](#performance-problems)
- [Display & Rendering](#display--rendering)
- [Audio Issues](#audio-issues)
- [Puzzle Problems](#puzzle-problems)
- [Mobile-Specific Issues](#mobile-specific-issues)
- [Browser-Specific Issues](#browser-specific-issues)
- [Account & Session Issues](#account--session-issues)

## Connection Issues

### Can't Connect to Server

**Symptoms:**
- "Connection failed" message
- Stuck on "Connecting..."
- Repeated disconnections

**Solutions:**

1. **Check Internet Connection**
   - Try loading other websites
   - Check if you're on a restricted network (school, office)
   - Restart your router if needed

2. **Firewall/Antivirus**
   - Add escapetogether.com to exceptions
   - Temporarily disable firewall to test
   - Check if port 3001 is blocked

3. **Browser Extensions**
   - Disable ad blockers
   - Turn off VPN/proxy extensions
   - Try incognito/private mode

4. **Server Status**
   - Check @EscapeTogetherStatus on Twitter
   - Visit status.escapetogether.com

### Frequent Disconnections

**Solutions:**

1. **Stable Connection Required**
   - Use wired instead of WiFi if possible
   - Check signal strength
   - Close bandwidth-heavy applications

2. **Browser Settings**
   - Ensure JavaScript is enabled
   - Clear browser cache
   - Update browser to latest version

3. **Network Configuration**
   - Check MTU settings (should be 1500)
   - Disable QoS if configured
   - Restart network adapter

## Performance Problems

### Slow Loading Times

**Solutions:**

1. **Clear Browser Data**
   ```
   Chrome: Settings > Privacy > Clear Browsing Data
   Firefox: Options > Privacy > Clear History
   Safari: Develop > Empty Caches
   ```

2. **Disable Extensions**
   - Ad blockers
   - Privacy plugins
   - Download managers

3. **Hardware Acceleration**
   - Enable in browser settings
   - Update graphics drivers

### Low Frame Rate / Lag

**Solutions:**

1. **Reduce Graphics Quality**
   - Disable particle effects in settings
   - Reduce animation complexity
   - Use accessibility settings to reduce motion

2. **Close Other Applications**
   - Free up system memory
   - Close other browser tabs
   - Check CPU usage in Task Manager

3. **Browser Performance**
   - Try a different browser
   - Disable hardware acceleration (if issues persist)
   - Reduce browser zoom level

### High Memory Usage

**Solutions:**

1. **Regular Browser Restart**
   - Restart browser every 2-3 hours
   - Clear cache regularly

2. **Reduce Session Data**
   - Clear chat history if very long
   - Restart game after completing rooms

## Display & Rendering

### Game Canvas Not Loading

**Solutions:**

1. **WebGL Check**
   - Visit get.webgl.org to verify WebGL support
   - Update graphics drivers
   - Try hardware acceleration toggle

2. **Browser Compatibility**
   - Use Chrome, Firefox, or Edge
   - Update to latest browser version
   - Try different browser

3. **Canvas Errors**
   - Clear browser cache
   - Disable extensions
   - Check console for errors (F12)

### Visual Glitches

**Solutions:**

1. **Graphics Driver Update**
   - Update GPU drivers
   - Restart computer after update

2. **Browser Settings**
   - Reset browser settings
   - Clear cache and cookies
   - Disable hardware acceleration temporarily

3. **Screen Resolution**
   - Try fullscreen mode
   - Adjust browser zoom to 100%
   - Check display settings

### Text Rendering Issues

**Solutions:**

1. **Font Loading**
   - Clear browser cache
   - Disable ad blockers
   - Check internet connection

2. **Accessibility Override**
   - Use accessibility settings
   - Adjust text size in browser
   - Try different font settings

## Audio Issues

### No Sound

**Solutions:**

1. **Browser Permissions**
   - Check site permissions
   - Allow audio autoplay
   - Unmute browser tab

2. **System Settings**
   - Check system volume
   - Verify audio output device
   - Test audio in other applications

3. **In-Game Settings**
   - Toggle sound on/off in settings
   - Adjust volume slider
   - Restart game after changes

### Audio Distortion

**Solutions:**

1. **Reduce Quality**
   - Lower sample rate in settings
   - Disable audio effects

2. **System Audio**
   - Update audio drivers
   - Check for conflicting audio apps
   - Try different output device

## Puzzle Problems

### Puzzle Not Responding

**Solutions:**

1. **Refresh Puzzle**
   - Navigate away and back
   - Use reset puzzle option (if available)
   - Reload page

2. **Check Requirements**
   - Verify you have necessary items
   - Check if other puzzles need completion first
   - Ensure correct role for puzzle

### Can't Interact with Objects

**Solutions:**

1. **Role Permissions**
   - Check your current role
   - Some objects require specific roles
   - Ask partner to interact

2. **Technical Issues**
   - Refresh the page
   - Check if object is clickable (hover cursor)
   - Try different browser

### Stuck on Puzzle

**Solutions:**

1. **Use Hints**
   - Request hint from hint menu
   - Check hint uses remaining
   - Work through hint tiers

2. **Partner Communication**
   - Ask partner for their perspective
   - Share what you each see
   - Work through together

3. **Walkthrough (Last Resort)**
   - Check online walkthrough
   - Ask for help in community
   - Contact support

## Mobile-Specific Issues

### Screen Not Rotating

**Solutions:**

1. **Device Settings**
   - Check orientation lock
   - Enable auto-rotate
   - Restart device

2. **Browser Settings**
   - Enable rotation in browser
   - Refresh page after enabling

### Touch Not Responding

**Solutions:**

1. **Screen Cleanliness**
   - Clean screen
   - Dry hands thoroughly
   - Remove screen protector if damaged

2. **Touch Settings**
   - Adjust touch sensitivity
   - Try stylus
   - Restart device

### Mobile Browser Crashes

**Solutions:**

1. **Memory Management**
   - Close other apps
   - Clear browser cache
   - Restart device

2. **Browser Choice**
   - Try Chrome mobile
   - Try Firefox mobile
   - Use browser with good WebGL support

## Browser-Specific Issues

### Chrome

**Issues:** Black screen, WebGL errors
**Solutions:**
- Enable hardware acceleration
- Clear cache
- Disable extensions
- Update Chrome

### Firefox

**Issues:** Performance drops, audio issues
**Solutions:**
- Adjust performance settings
- Clear cache
- Update graphics drivers
- Refresh Firefox

### Safari

**Issues:** Canvas not loading, audio autoplay
**Solutions:**
- Enable WebGL
- Allow autoplay for site
- Clear cache
- Update Safari

### Edge

**Issues:** Compatibility problems
**Solutions:**
- Use Chromium-based Edge
- Update to latest version
- Clear browsing data

## Account & Session Issues

### Can't Join Room

**Solutions:**

1. **Room Code**
   - Verify room code is correct
   - Check for extra spaces
   - Ensure room hasn't expired

2. **Name Issues**
   - Use alphanumeric characters
   - Avoid special characters
   - Keep name under 20 characters

### Lost Progress

**Solutions:**

1. **Session Timeout**
   - Game auto-saves progress
   - Rejoin room within timeout period
   - Contact support if issue persists

2. **Browser Storage**
   - Don't clear browser storage during game
   - Use same browser to rejoin
   - Check if cookies are enabled

## Getting Additional Help

### Diagnostic Information

When reporting issues, include:

1. **Browser:** Chrome 90.0
2. **OS:** Windows 10
3. **Device:** Desktop/Mobile/Tablet
4. **Error Message:** Exact text
5. **Steps to Reproduce:** What you were doing
6. **Console Errors:** Open browser console (F12) and share errors

### Support Channels

- **Email:** support@escapetogether.com
- **Discord:** discord.gg/escapetogether
- **Twitter:** @EscapeTogether
- **FAQ:** escapetogether.com/faq

### Community Help

- **Forums:** forums.escapetogether.com
- **Reddit:** r/EscapeTwogether
- **Wiki:** wiki.escapetogether.com

## Known Issues

### Currently Known

1. **Safari Audio Autoplay**
   - Status: Working on fix
   - Workaround: Click anywhere on page to enable audio

2. **Firefox Mobile Performance**
   - Status: Investigating
   - Workaround: Use Chrome mobile for better performance

3. **Low Memory Devices**
   - Status: Optimization in progress
   - Workaround: Close other tabs, use desktop if available

### Report New Issues

Found a new issue? Report it at:
- GitHub Issues: github.com/escapetogether/issues
- In-Game: Use report bug button in settings
- Email: bugs@escapetogether.com
