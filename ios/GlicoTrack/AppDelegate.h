//
//  AppDelegate.h
//  GlicoTrack
//
//  XCODE 16.4 WORKAROUND: Objective-C para evitar problemas UIKit
//

#import <UIKit/UIKit.h>

@class RCTBridge;

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) RCTBridge *bridge;

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

@end