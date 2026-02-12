import requests
import random
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import statistics

API_BASE_URL = "http://localhost:8000/api/leaderboard"

# Statistics tracking
request_times = {
    'submit': [],
    'top': [],
    'rank': []
}

def submit_score(user_id):
    """Simulate score submission"""
    try:
        start_time = time.time()
        score = random.randint(100, 10000)
        response = requests.post(
            f"{API_BASE_URL}/submit",
            json={"user_id": user_id, "score": score},
            timeout=5
        )
        elapsed = (time.time() - start_time) * 1000  # Convert to ms
        request_times['submit'].append(elapsed)
        
        if response.status_code == 200:
            return f"✅ Score submitted for user {user_id}: {score} points ({elapsed:.2f}ms)"
        else:
            return f"❌ Error submitting score for user {user_id}: {response.status_code}"
    except Exception as e:
        return f"❌ Exception submitting score: {str(e)}"

def get_top_players():
    """Fetch top players"""
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/top", timeout=5)
        elapsed = (time.time() - start_time) * 1000
        request_times['top'].append(elapsed)
        
        if response.status_code == 200:
            data = response.json()
            source = data.get('source', 'unknown')
            return f"✅ Top players fetched from {source} ({elapsed:.2f}ms)"
        else:
            return f"❌ Error fetching top players: {response.status_code}"
    except Exception as e:
        return f"❌ Exception fetching top players: {str(e)}"

def get_user_rank(user_id):
    """Fetch user rank"""
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/rank/{user_id}", timeout=5)
        elapsed = (time.time() - start_time) * 1000
        request_times['rank'].append(elapsed)
        
        if response.status_code == 200:
            data = response.json()
            rank = data.get('data', {}).get('rank', 'N/A')
            return f"✅ User {user_id} rank: {rank} ({elapsed:.2f}ms)"
        else:
            return f"❌ Error fetching rank for user {user_id}: {response.status_code}"
    except Exception as e:
        return f"❌ Exception fetching rank: {str(e)}"

def print_statistics():
    """Print performance statistics"""
    print("\n" + "="*60)
    print("PERFORMANCE STATISTICS")
    print("="*60)
    
    for operation, times in request_times.items():
        if times:
            print(f"\n{operation.upper()} OPERATION:")
            print(f"  Total requests: {len(times)}")
            print(f"  Average time: {statistics.mean(times):.2f}ms")
            print(f"  Median time: {statistics.median(times):.2f}ms")
            print(f"  Min time: {min(times):.2f}ms")
            print(f"  Max time: {max(times):.2f}ms")
            if len(times) > 1:
                print(f"  Std deviation: {statistics.stdev(times):.2f}ms")
    
    print("\n" + "="*60)

def run_load_test(duration_seconds=60, max_workers=10):
    """
    Run load test for specified duration
    
    Args:
        duration_seconds: How long to run the test
        max_workers: Number of concurrent threads
    """
    print(f"🚀 Starting load test for {duration_seconds} seconds with {max_workers} workers...")
    print(f"🎯 Target API: {API_BASE_URL}")
    print("="*60)
    
    start_time = time.time()
    request_count = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        while time.time() - start_time < duration_seconds:
            futures = []
            
            # Submit multiple operations concurrently
            for _ in range(max_workers):
                user_id = random.randint(1, 1000000)
                
                # Randomly choose operation
                operation = random.choice(['submit', 'top', 'rank', 'rank'])
                
                if operation == 'submit':
                    futures.append(executor.submit(submit_score, user_id))
                elif operation == 'top':
                    futures.append(executor.submit(get_top_players))
                else:
                    futures.append(executor.submit(get_user_rank, user_id))
                
                request_count += 1
            
            # Wait for all operations to complete
            for future in as_completed(futures):
                result = future.result()
                if request_count % 10 == 0:  # Print every 10th result
                    print(result)
            
            # Small delay between batches
            time.sleep(random.uniform(0.5, 1.5))
    
    elapsed_time = time.time() - start_time
    print(f"\n✅ Load test completed!")
    print(f"📊 Total requests: {request_count}")
    print(f"⏱️  Total time: {elapsed_time:.2f} seconds")
    print(f"📈 Requests per second: {request_count / elapsed_time:.2f}")
    
    print_statistics()

def run_continuous_simulation():
    """Run continuous simulation (original script behavior)"""
    print("🎮 Starting continuous simulation...")
    print(f"🎯 Target API: {API_BASE_URL}")
    print("Press Ctrl+C to stop\n")
    
    try:
        iteration = 0
        while True:
            iteration += 1
            user_id = random.randint(1, 1000000)
            
            # Submit score
            print(f"\n--- Iteration {iteration} ---")
            print(submit_score(user_id))
            
            # Get top players
            print(get_top_players())
            
            # Get user rank
            print(get_user_rank(user_id))
            
            # Simulate real user interaction
            time.sleep(random.uniform(0.5, 2))
            
    except KeyboardInterrupt:
        print("\n\n🛑 Simulation stopped by user")
        print_statistics()

if __name__ == "__main__":
    import sys
    
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║       GAMING LEADERBOARD - LOAD TEST SCRIPT          ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    print("Choose mode:")
    print("1. Continuous simulation (original)")
    print("2. Load test (60 seconds)")
    print("3. Heavy load test (5 minutes)")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    if choice == "1":
        run_continuous_simulation()
    elif choice == "2":
        run_load_test(duration_seconds=60, max_workers=10)
    elif choice == "3":
        run_load_test(duration_seconds=300, max_workers=20)
    else:
        print("Invalid choice. Running continuous simulation...")
        run_continuous_simulation()