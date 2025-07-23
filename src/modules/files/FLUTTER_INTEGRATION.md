# Flutter Integration Guide - Files Module

This guide explains how to integrate the optimized Files Module with your Flutter app.

## Key Changes for Flutter Optimization

### 1. **Simplified File Serving**
- **Single Endpoint**: `/files/:id/serve` - handles all file serving needs
- **Mobile-Optimized Caching**: 2-hour cache with ETag support
- **No Browser-Specific Headers**: Removed attachment/download headers

### 2. **Mobile-Friendly File Formats**
- **Added Support**: HEIC/HEIF (iOS camera formats)
- **Audio/Video**: Added mobile formats (3GPP, QuickTime, AAC, WAV)
- **Reduced Limits**: More conservative file size limits for mobile networks

### 3. **Enhanced Response Data**
```typescript
{
  id: string,
  originalName: string,
  fileSize: number,
  mimeType: string,
  // Mobile-specific additions:
  fileCategory: 'image' | 'video' | 'document' | 'audio' | 'other',
  isMobileCameraFormat: boolean,
  serveUrl: string,           // Direct URL: /files/{id}/serve
  formattedSize: string,      // "2.5 MB"
  previewUrl?: string         // For thumbnails: /files/{id}/thumbnail/small
}
```

## Flutter Implementation Examples

### 1. **File Upload**
```dart
Future<Map<String, dynamic>> uploadFile(File file, String context) async {
  var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/files/upload'));
  request.headers['Authorization'] = 'Bearer $token';
  request.fields['context'] = context;
  request.files.add(await http.MultipartFile.fromPath('file', file.path));
  
  var response = await request.send();
  var responseData = await response.stream.transform(utf8.decoder).join();
  return json.decode(responseData);
}
```

### 2. **Display File in Flutter**
```dart
Widget buildFileWidget(Map<String, dynamic> fileData) {
  String category = fileData['fileCategory'];
  String serveUrl = '$baseUrl${fileData['serveUrl']}';
  
  switch (category) {
    case 'image':
      return Image.network(
        serveUrl,
        headers: {'Authorization': 'Bearer $token'},
        loadingBuilder: (context, child, progress) {
          return progress == null ? child : CircularProgressIndicator();
        },
      );
      
    case 'video':
      return VideoPlayer(NetworkVideoPlayerController.network(
        serveUrl,
        httpHeaders: {'Authorization': 'Bearer $token'},
      ));
      
    default:
      return ListTile(
        leading: Icon(getFileIcon(category)),
        title: Text(fileData['originalName']),
        subtitle: Text(fileData['formattedSize']),
        onTap: () => downloadFile(fileData),
      );
  }
}
```

### 3. **Image Thumbnails**
```dart
Widget buildImageThumbnail(String fileId) {
  return Image.network(
    '$baseUrl/files/$fileId/thumbnail/small',
    headers: {'Authorization': 'Bearer $token'},
    fit: BoxFit.cover,
    errorBuilder: (context, error, stackTrace) {
      return Icon(Icons.image_not_supported);
    },
  );
}
```

### 4. **File Download**
```dart
Future<void> downloadFile(Map<String, dynamic> fileData) async {
  String url = '$baseUrl${fileData['serveUrl']}';
  
  final response = await http.get(
    Uri.parse(url),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    // Save to device storage or open in app
    final bytes = response.bodyBytes;
    await saveFileToDevice(bytes, fileData['originalName']);
  }
}
```

### 5. **File Metadata Only**
```dart
Future<Map<String, dynamic>> getFileMetadata(String fileId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/files/$fileId/metadata'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  return json.decode(response.body);
}
```

## API Endpoints Summary

| Endpoint | Method | Purpose | Flutter Usage |
|----------|--------|---------|---------------|
| `/files/upload` | POST | Upload file | File picker → API |
| `/files/:id/serve` | GET | Get file content | Display images/videos |
| `/files/:id/metadata` | GET | Get file info only | File lists, UI display |
| `/files/:id/thumbnail/:size` | GET | Get image thumbnail | Grid views, previews |
| `/files` | GET | List files | File browser |

## Performance Tips for Flutter

1. **Use Thumbnails**: Always use `/thumbnail/small` for grid views
2. **Cache Images**: Flutter automatically caches network images
3. **Lazy Loading**: Load file content only when needed
4. **Progress Indicators**: Show upload/download progress
5. **Error Handling**: Handle network errors gracefully

## File Categories for UI

The API returns `fileCategory` to help with Flutter UI:
- `image`: Show Image.network widget
- `video`: Show VideoPlayer widget  
- `document`: Show document icon + name
- `audio`: Show audio player widget
- `other`: Show generic file icon

## Mobile Camera Support

The API now supports iOS HEIC/HEIF formats automatically. Your Flutter app can upload directly from camera without conversion.
